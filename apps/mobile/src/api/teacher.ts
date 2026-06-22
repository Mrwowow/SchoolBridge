/**
 * src/api/teacher.ts
 * Teacher actions: attendance register, results entry, subjects, terms, and the
 * class daily report-status. All school-scoped.
 */
import type {
  BulkAttendanceDto,
  UpsertResultDto,
  ClassReportStatusView,
} from '@schoolbridge/types';
import { api } from './client';
import { schoolPath } from './tenant';

export interface Subject {
  id: string;
  name: string;
}

export interface TermItem {
  id: string;
  label: string;
  isCurrent: boolean;
  academicYearId: string;
}

interface AcademicYear {
  id: string;
  label: string;
  isCurrent: boolean;
  terms: TermItem[];
}

export const teacherApi = {
  // ── Subjects ───────────────────────────────────────────────────────────────
  getSubjects: (): Promise<Subject[]> => api.get(schoolPath('/subjects')),
  createSubject: (name: string): Promise<Subject> =>
    api.post(schoolPath('/subjects'), { name }),

  // ── Terms (flattened from academic years) ───────────────────────────────────
  getTerms: (): Promise<TermItem[]> =>
    api
      .get<AcademicYear[]>(schoolPath('/academic/years'))
      .then((years) => years.flatMap((y) => y.terms)),

  // ── Class daily report status (attendance + report sent per pupil) ──────────
  getReportStatus: (classId: string, date?: string): Promise<ClassReportStatusView> =>
    api.get(
      schoolPath(`/classes/${classId}/report-status${date ? `?date=${date}` : ''}`),
    ),

  // ── Attendance register ─────────────────────────────────────────────────────
  bulkAttendance: (dto: BulkAttendanceDto): Promise<{ recorded: number; date: string }> =>
    api.post(schoolPath('/attendance/bulk'), dto),

  // ── Results entry ───────────────────────────────────────────────────────────
  upsertResult: (dto: UpsertResultDto): Promise<unknown> =>
    api.post(schoolPath('/results'), dto),
};
