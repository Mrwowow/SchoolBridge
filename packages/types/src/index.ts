/**
 * @schoolbridge/types — shared contract layer.
 * Zod schemas double as runtime validators (API) and TS types (clients),
 * keeping backend and clients in sync. Import schemas in the API for
 * validation, and the inferred types anywhere.
 */
export * from './enums';
export * from './auth';
export * from './messages';
export * from './schools';
export * from './plans';
export * from './parent';
export * from './users';
export * from './roster';
export * from './attendance';
export * from './results';
export * from './notifications';
export * from './fees';
export * from './subscriptions';
export * from './media';
export * from './pagination';
