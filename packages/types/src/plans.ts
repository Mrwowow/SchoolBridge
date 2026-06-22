import { z } from 'zod';
import { SchoolPlan } from './enums';

export const BillingInterval = z.enum(['MONTHLY', 'YEARLY']);
export type BillingInterval = z.infer<typeof BillingInterval>;

/** A plan tier as stored in the catalog (see Prisma `Plan`). */
export interface Plan {
  tier: SchoolPlan;
  name: string;
  description: string;
  priceNaira: number;
  billingInterval: BillingInterval;
  /** null = unlimited. */
  maxPupils: number | null;
  maxStaff: number | null;
  smsQuota: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable fields of a plan tier (SUPER_ADMIN). The `tier` itself is the key
 * and is taken from the route, not the body. Limit fields accept null to mean
 * "unlimited".
 */
export const UpdatePlanDto = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(280).optional(),
  priceNaira: z.number().int().min(0).max(100_000_000).optional(),
  billingInterval: BillingInterval.optional(),
  maxPupils: z.number().int().min(1).nullable().optional(),
  maxStaff: z.number().int().min(1).nullable().optional(),
  smsQuota: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePlanDto = z.infer<typeof UpdatePlanDto>;
