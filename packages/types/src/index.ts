/**
 * @schoolbridge/types — shared contract layer.
 * Zod schemas double as runtime validators (API) and TS types (clients),
 * keeping backend and clients in sync. Import schemas in the API for
 * validation, and the inferred types anywhere.
 */
export * from './enums';
export * from './auth';
export * from './messages';
export * from './pagination';
