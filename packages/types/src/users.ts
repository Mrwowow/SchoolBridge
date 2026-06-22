import { z } from 'zod';
import { phoneSchema } from './auth';

/** Query for looking up an existing user by phone (admin: add staff by phone). */
export const LookupUserQuery = z.object({
  phone: phoneSchema,
});
export type LookupUserQuery = z.infer<typeof LookupUserQuery>;
