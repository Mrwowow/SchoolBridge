import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { MessageFanOutJobData } from './notifications.service';
import { NOTIFICATION_QUEUE } from './notifications.service';
import { buildRedisConnection, notificationsEnabled } from './redis.util';

/**
 * NotificationsProcessor runs a BullMQ Worker that processes notification jobs.
 *
 * Current implementation is a stub that logs the job data.
 *
 * TODO:
 *   - Load GuardianLink records for each pupilId to get parent User rows
 *   - For each guardian:
 *     a. PUSH  → TODO: send via Expo Push API using their stored device token
 *        (use expo-server-sdk: https://docs.expo.dev/push-notifications/sending-notifications/)
 *     b. SMS   → TODO: send via Termii API (TERMII_API_KEY env var)
 *        POST https://api.ng.termii.com/api/sms/send
 *     c. IN_APP → persist Notification row; the realtime gateway will emit it
 *   - Update Notification.status to SENT / FAILED accordingly
 */
@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private worker?: Worker<MessageFanOutJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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

    // TODO: replace stub with real notification dispatch
    // See class-level JSDoc for the intended implementation.

    // Create IN_APP notification stubs so the client can poll
    const guardians = await this.prisma.guardianLink.findMany({
      where: { pupilId: { in: pupilIds } },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (guardians.length === 0) return;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { title: true },
    });

    await this.prisma.notification.createMany({
      data: guardians.map((g) => ({
        schoolId,
        userId: g.userId,
        channel: 'IN_APP' as const,
        status: 'SENT' as const,
        title: 'New message from school',
        body: message?.title ?? 'You have a new message',
        sentAt: new Date(),
        data: { messageId },
      })),
      skipDuplicates: true,
    });
  }
}
