import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { MessageFanOutJobData } from './notifications.service';
import { NOTIFICATION_QUEUE } from './notifications.service';
import { buildRedisConnection, notificationsEnabled } from './redis.util';
import { PushSender } from './dispatch/push.sender';
import { SmsSender } from './dispatch/sms.sender';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

/** Message types important enough to warrant an SMS fallback (data-cost aware). */
const CRITICAL_TYPES = new Set(['FEE_REMINDER', 'ATTENDANCE', 'BEHAVIOUR']);

/**
 * NotificationsProcessor runs a BullMQ Worker that consumes message-fan-out
 * jobs and dispatches notifications to each affected pupil's guardians:
 *
 *   IN_APP → persist a Notification row + emit `notification:new` over realtime
 *   PUSH   → Expo Push API for every registered device token
 *
 * SMS is reserved for critical message types (FEE_REMINDER) to keep costs down.
 * Each Notification row records its channel + delivery status.
 */
@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private worker?: Worker<MessageFanOutJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly push: PushSender,
    private readonly sms: SmsSender,
    private readonly realtime: RealtimeGateway,
  ) {}

  onModuleInit() {
    if (!notificationsEnabled(this.config.get<string>('NOTIFICATIONS_ENABLED'))) {
      this.logger.warn('Notifications disabled (NOTIFICATIONS_ENABLED=false) — worker not started');
      return;
    }

    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');

    this.worker = new Worker<MessageFanOutJobData>(
      NOTIFICATION_QUEUE,
      async (job: Job<MessageFanOutJobData>) => this.process(job),
      {
        connection: buildRedisConnection(redisUrl),
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    // Without an error listener, a Redis outage throws an unhandled 'error'
    // event and can take the process down. Log it instead.
    this.worker.on('error', (err) => {
      this.logger.warn(`Notification worker connection error: ${err.message}`);
    });

    this.logger.log('Notification worker started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<MessageFanOutJobData>): Promise<void> {
    const { messageId, pupilIds, schoolId } = job.data;
    this.logger.debug(
      `Processing message-fan-out: message=${messageId} pupils=${pupilIds.length} school=${schoolId}`,
    );

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { title: true, type: true },
    });
    if (!message) {
      this.logger.warn(`Message ${messageId} no longer exists — skipping fan-out`);
      return;
    }

    // Resolve distinct guardian users for the affected pupils.
    const guardians = await this.prisma.guardianLink.findMany({
      where: { pupilId: { in: pupilIds } },
      select: { userId: true },
      distinct: ['userId'],
    });
    if (guardians.length === 0) return;
    const userIds = guardians.map((g) => g.userId);

    const title = 'New message from school';
    const body = message.title;

    // 1. Persist IN_APP notifications.
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        schoolId,
        userId,
        channel: 'IN_APP' as const,
        status: 'SENT' as const,
        title,
        body,
        sentAt: new Date(),
        data: { messageId, type: message.type },
      })),
      skipDuplicates: true,
    });

    // 2. Emit realtime events so connected clients update instantly.
    this.realtime.emitNewMessage(schoolId, { messageId, schoolId, title: message.title, type: message.type });
    for (const userId of userIds) {
      this.realtime.emitNotification(userId, { messageId, title, body });
    }

    // 3. Push to every registered device.
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, token: true },
    });
    if (devices.length > 0) {
      const result = await this.push.send(
        devices.map((d) => ({ to: d.token, title, body, data: { messageId } })),
      );

      // Attribute status per user: a user is SENT if at least one of their
      // device tokens was accepted, FAILED only if every token was rejected.
      const failedTokenSet = new Set(result.failedTokens);
      const usersWithSuccess = new Set(
        devices.filter((d) => !failedTokenSet.has(d.token)).map((d) => d.userId),
      );
      const pushUsers = [...new Set(devices.map((d) => d.userId))];
      await this.prisma.notification.createMany({
        data: pushUsers.map((userId) => {
          const ok = usersWithSuccess.has(userId);
          return {
            schoolId,
            userId,
            channel: 'PUSH' as const,
            status: ok ? ('SENT' as const) : ('FAILED' as const),
            title,
            body,
            sentAt: ok ? new Date() : null,
            data: { messageId },
          };
        }),
      });

      // Prune tokens Expo reported as no longer registered so we stop retrying.
      if (result.unregisteredTokens.length > 0) {
        await this.prisma.deviceToken
          .deleteMany({ where: { token: { in: result.unregisteredTokens } } })
          .catch((err) =>
            this.logger.warn(`Failed to prune stale device tokens: ${err.message}`),
          );
      }

      this.logger.debug(`Push dispatched: sent=${result.sent} failed=${result.failed}`);
    }

    // 4. SMS fallback for critical message types — only to guardians WITHOUT a
    //    registered device (so push-reachable parents don't incur SMS cost).
    if (CRITICAL_TYPES.has(message.type)) {
      const reachableByPush = new Set(devices.map((d) => d.userId));
      const smsUserIds = userIds.filter((id) => !reachableByPush.has(id));
      if (smsUserIds.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { id: { in: smsUserIds } },
          select: { id: true, phone: true },
        });
        const smsText = `${message.title} — open SchoolBridge for details.`;
        // Send in parallel (one slow/failed SMS must not stall the rest), then
        // persist all rows in a single write.
        const outcomes = await Promise.all(
          users.map((u) =>
            this.sms
              .send(u.phone, smsText)
              .then((ok) => ({ userId: u.id, ok }))
              .catch(() => ({ userId: u.id, ok: false })),
          ),
        );
        const now = new Date();
        await this.prisma.notification.createMany({
          data: outcomes.map(({ userId, ok }) => ({
            schoolId,
            userId,
            channel: 'SMS' as const,
            status: ok ? ('SENT' as const) : ('FAILED' as const),
            title,
            body,
            sentAt: ok ? now : null,
            data: { messageId },
          })),
        });
        this.logger.debug(`SMS fallback attempted for ${users.length} guardians`);
      }
    }
  }
}
