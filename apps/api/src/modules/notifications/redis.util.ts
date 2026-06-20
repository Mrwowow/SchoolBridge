import { Logger } from '@nestjs/common';
import type { ConnectionOptions } from 'bullmq';

const logger = new Logger('Redis');

/**
 * Builds BullMQ connection options from REDIS_URL with a bounded retry strategy.
 *
 * Without a retry cap, ioredis reconnects forever and floods the logs when Redis
 * is down (e.g. local dev with no `docker compose up`). Here we back off, cap the
 * attempts, and surface a single warning instead of a stack-trace storm.
 *
 * `maxRetriesPerRequest: null` is required by BullMQ for blocking commands.
 */
export function buildRedisConnection(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.warn(
          `Redis unreachable at ${url.host} after ${times} attempts — ` +
            `notifications/queues are degraded. Is Redis running? (docker compose up -d redis)`,
        );
        return null; // stop retrying
      }
      return Math.min(times * 500, 5000);
    },
  };
}

/** True unless NOTIFICATIONS_ENABLED is explicitly set to "false". */
export function notificationsEnabled(value: string | undefined): boolean {
  return value !== 'false';
}
