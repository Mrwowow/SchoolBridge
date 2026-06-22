import { z } from 'zod';
import { SchoolPlan, SchoolStatus } from './enums';

export const CreateSchoolDto = z.object({
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers and hyphens only'),
  plan: SchoolPlan.optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateSchoolDto = z.infer<typeof CreateSchoolDto>;

export const UpdateSchoolDto = z.object({
  name: z.string().min(2).max(160).optional(),
  plan: SchoolPlan.optional(),
  status: SchoolStatus.optional(),
  settings: z.record(z.unknown()).optional(),
});
export type UpdateSchoolDto = z.infer<typeof UpdateSchoolDto>;

export const AddMemberDto = z.object({
  // IDs are cuids, not uuids.
  userId: z.string().min(1),
  role: z.enum(['SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT']),
});
export type AddMemberDto = z.infer<typeof AddMemberDto>;
