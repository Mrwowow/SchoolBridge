import { z } from 'zod';
import { AttendanceStatus } from './enums';

const id = () => z.string().min(1);

/**
 * Bulk attendance for a class on a given date — the daily register.
 * One entry per pupil; the API upserts on (pupilId, date).
 */
export const BulkAttendanceDto = z.object({
  termId: id(),
  classRoomId: id(),
  date: z.coerce.date(),
  entries: z
    .array(
      z.object({
        pupilId: id(),
        status: AttendanceStatus,
        note: z.string().max(280).optional(),
        /** Optional mood captured at register time, e.g. "Cheerful". */
        mood: z.string().max(40).optional(),
        /** Optional arrival time (drives "arrived 7:42 AM" on the parent home). */
        arrivedAt: z.coerce.date().optional(),
      }),
    )
    .min(1)
    .max(200),
});
export type BulkAttendanceDto = z.infer<typeof BulkAttendanceDto>;

export const AttendanceQuery = z.object({
  classId: id().optional(),
  pupilId: id().optional(),
  termId: id().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type AttendanceQuery = z.infer<typeof AttendanceQuery>;
