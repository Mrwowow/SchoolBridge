import { Inject } from '@nestjs/common';

/**
 * Simple injection token helper for BullMQ queues.
 * Mirrors the pattern used by @nestjs/bull but without pulling in that package.
 */
export const getQueueToken = (name: string) => `BULLMQ_QUEUE_${name.toUpperCase()}`;

export const InjectQueue = (name: string) => Inject(getQueueToken(name));
