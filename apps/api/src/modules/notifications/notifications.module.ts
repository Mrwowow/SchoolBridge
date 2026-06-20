import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { NotificationsService, NOTIFICATION_QUEUE } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { getQueueToken } from './queue.decorator';
import { buildRedisConnection, notificationsEnabled } from './redis.util';

/** No-op stand-in used when NOTIFICATIONS_ENABLED=false so the API runs without Redis. */
const NOOP_QUEUE = {
  async add() {
    /* notifications disabled — drop the job */
  },
  async close() {
    /* nothing to close */
  },
} as unknown as Queue;

/**
 * Provides:
 *   - A BullMQ Queue instance (producer)
 *   - NotificationsService (enqueue helper)
 *   - NotificationsProcessor (Worker consumer, starts on module init)
 */
@Module({
  providers: [
    {
      provide: getQueueToken(NOTIFICATION_QUEUE),
      inject: [ConfigService],
      useFactory: (config: ConfigService): Queue => {
        if (!notificationsEnabled(config.get<string>('NOTIFICATIONS_ENABLED'))) {
          return NOOP_QUEUE;
        }
        const redisUrl = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        return new Queue(NOTIFICATION_QUEUE, {
          connection: buildRedisConnection(redisUrl),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        });
      },
    },
    NotificationsService,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
