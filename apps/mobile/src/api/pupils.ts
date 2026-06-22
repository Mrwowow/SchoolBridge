/**
 * src/api/pupils.ts
 * Parent-facing pupil reads (children, day summary, progress) and teacher
 * writes (day notes, behaviour ratings, badges). All school-scoped.
 */
import type {
  ChildSummary,
  DaySummaryView,
  ProgressView,
  UpsertDaySubjectNoteDto,
  UpsertBehaviourRatingDto,
  CreatePupilBadgeDto,
} from '@schoolbridge/types';
import { api } from './client';
import { schoolPath } from './tenant';

/** Re-export for screens that referenced the old name. */
export type PupilSummary = ChildSummary;

export const pupilsApi = {
  /** Pupils linked to the authenticated parent. */
  getMyChildren: (): Promise<ChildSummary[]> =>
    api.get(schoolPath('/parents/me/pupils')),

  /** A pupil's "today" report (attendance, subjects, behaviour). */
  getDaySummary: (pupilId: string, date?: string): Promise<DaySummaryView> =>
    api.get(
      schoolPath(`/parents/${pupilId}/day-summary${date ? `?date=${date}` : ''}`),
    ),

  /** A pupil's term progress / report card. */
  getProgress: (pupilId: string, termId?: string): Promise<ProgressView> =>
    api.get(
      schoolPath(`/parents/${pupilId}/progress${termId ? `?termId=${termId}` : ''}`),
    ),

  // ── Teacher writes ────────────────────────────────────────────────────────

  upsertDayNote: (pupilId: string, dto: UpsertDaySubjectNoteDto): Promise<unknown> =>
    api.post(schoolPath(`/pupils/${pupilId}/day-notes`), dto),

  upsertBehaviour: (pupilId: string, dto: UpsertBehaviourRatingDto): Promise<unknown> =>
    api.post(schoolPath(`/pupils/${pupilId}/behaviour`), dto),

  createBadge: (pupilId: string, dto: CreatePupilBadgeDto): Promise<unknown> =>
    api.post(schoolPath(`/pupils/${pupilId}/badges`), dto),
};
