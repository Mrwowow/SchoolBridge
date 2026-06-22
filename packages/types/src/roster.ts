import { z } from 'zod';
import { GuardianRelationship } from './enums';

/**
 * Roster & academic-setup contracts (Phase 2).
 *
 * Note on IDs: SchoolBridge uses cuid() primary keys, which are NOT UUIDs,
 * so identifier fields are validated as non-empty strings (not `.uuid()`).
 */

const id = () => z.string().min(1);

// ── Pupils ────────────────────────────────────────────────────────────────

export const CreatePupilDto = z.object({
  fullName: z.string().min(2).max(160),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  admissionNo: z.string().min(1).max(64).optional(),
});
export type CreatePupilDto = z.infer<typeof CreatePupilDto>;

export const UpdatePupilDto = CreatePupilDto.partial();
export type UpdatePupilDto = z.infer<typeof UpdatePupilDto>;

// ── Classes (ClassRoom) ─────────────────────────────────────────────────────

export const CreateClassDto = z.object({
  name: z.string().min(1).max(64),
  classTeacherId: id().optional(),
});
export type CreateClassDto = z.infer<typeof CreateClassDto>;

export const UpdateClassDto = CreateClassDto.partial();
export type UpdateClassDto = z.infer<typeof UpdateClassDto>;

// ── Subjects ────────────────────────────────────────────────────────────────

export const CreateSubjectDto = z.object({
  name: z.string().min(1).max(80),
});
export type CreateSubjectDto = z.infer<typeof CreateSubjectDto>;

export const UpdateSubjectDto = CreateSubjectDto.partial();
export type UpdateSubjectDto = z.infer<typeof UpdateSubjectDto>;

// ── Academic Years ──────────────────────────────────────────────────────────

export const CreateAcademicYearDto = z
  .object({
    label: z.string().min(4).max(32), // e.g. "2024/2025"
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });
export type CreateAcademicYearDto = z.infer<typeof CreateAcademicYearDto>;

// ── Terms ─────────────────────────────────────────────────────────────────

export const CreateTermDto = z
  .object({
    academicYearId: id(),
    label: z.string().min(2).max(32), // e.g. "First Term"
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });
export type CreateTermDto = z.infer<typeof CreateTermDto>;

// ── Enrollments ─────────────────────────────────────────────────────────────

export const EnrollPupilDto = z.object({
  pupilId: id(),
  classRoomId: id(),
});
export type EnrollPupilDto = z.infer<typeof EnrollPupilDto>;

// ── Guardian links ──────────────────────────────────────────────────────────

export const LinkGuardianDto = z.object({
  userId: id(),
  relationship: GuardianRelationship.optional(),
  isPrimary: z.boolean().optional(),
});
export type LinkGuardianDto = z.infer<typeof LinkGuardianDto>;
