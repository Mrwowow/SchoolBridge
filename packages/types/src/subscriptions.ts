import { z } from 'zod';
import { SchoolPlan } from './enums';

const id = () => z.string().min(1);

/** Create or replace a school's subscription (SUPER_ADMIN). */
export const UpsertSubscriptionDto = z
  .object({
    schoolId: id(),
    plan: SchoolPlan,
    currentPeriodStart: z.coerce.date(),
    currentPeriodEnd: z.coerce.date(),
    paystackSubCode: z.string().optional(),
  })
  .refine((d) => d.currentPeriodEnd > d.currentPeriodStart, {
    message: 'currentPeriodEnd must be after currentPeriodStart',
    path: ['currentPeriodEnd'],
  });
export type UpsertSubscriptionDto = z.infer<typeof UpsertSubscriptionDto>;
