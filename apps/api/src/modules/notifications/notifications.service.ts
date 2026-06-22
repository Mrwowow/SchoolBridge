import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from './queue.decorator';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import type { PaginationQuery, Paginated } from '@schoolbridge/types';

export const NOTIFICATION_QUEUE = 'notifications';

export interface MessageFanOutJobData {
  messageId: string;
  pupilIds: string[];
  schoolId: string;
}

/**
 * NotificationsService is the thin producer-side of the notification pipeline.
 * It enqueues jobs on the BullMQ `notifications` queue which a separate worker
 * process (or the NotificationsProcessor below) will consume.
 *
 * TODO: implement a full NotificationsProcessor that:
 *   1. Loads guardian phone numbers for each pupilId
 *   2. Sends SMS via Termii (TERMII_API_KEY)
 *   3. Sends push via Expo (expo-server-sdk) using stored device tokens
 *   4. Persists each Notification record with channel + status
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE)
    private readonly queue: Queue<MessageFanOutJobData>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueMessageFanOut(
    messageId: string,
    pupilIds: string[],
    schoolId: string,
  ): Promise<void> {
    if (pupilIds.length === 0) return;

    await this.queue.add(
      'message-fan-out',
      { messageId, pupilIds, schoolId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 100 },
      },
    );

    this.logger.debug(
      `Enqueued message-fan-out for message=${messageId} pupils=${pupilIds.length}`,
    );
  }

  // ── Consumer-facing reads (mobile/web notification centre) ──────────────────

  async listForUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<Paginated<{ id: string; title: string; body: string; readAt: Date | null; createdAt: Date }>> {
    const { cursor, limit } = query;

    const rows = await this.prisma.notification.findMany({
      where: { userId, channel: 'IN_APP' },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, title: true, body: true, readAt: true, createdAt: true },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items.at(-1);
    return { items, nextCursor: hasMore && lastItem ? lastItem.id : null };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, channel: 'IN_APP', readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      const exists = await this.prisma.notification.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Notification not found');
    }
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, channel: 'IN_APP', readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  // ── Device tokens (push registration) ───────────────────────────────────────

  async registerDeviceToken(
    userId: string,
    token: string,
    platform?: string,
  ): Promise<{ id: string }> {
    const row = await this.prisma.deviceToken.upsert({
      where: { token },
      create: { userId, token, platform: platform ?? null },
      update: { userId, platform: platform ?? null, lastSeenAt: new Date() },
      select: { id: true },
    });
    return row;
  }

  async removeDeviceToken(userId: string, token: string): Promise<void> {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
  }
}
