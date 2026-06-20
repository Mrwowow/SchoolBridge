import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from './queue.decorator';
import type { Queue } from 'bullmq';

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
}
