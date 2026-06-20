/**
 * src/api/pupils.ts
 * Pupil / children API calls.
 */
import { api } from './client';

export interface PupilSummary {
  id: string;
  fullName: string;
  admissionNumber: string;
  className: string;
  classId: string;
  avatarUrl: string | null;
  /** Unread message count for badge */
  unreadCount: number;
}

export const pupilsApi = {
  /**
   * Returns the list of pupils linked to the authenticated parent.
   * TODO: confirm endpoint path with backend — assumed /parents/me/pupils
   */
  getMyChildren: (): Promise<PupilSummary[]> =>
    api.get<PupilSummary[]>('/parents/me/pupils'),

  /** Single pupil detail */
  getPupil: (pupilId: string): Promise<PupilSummary> =>
    api.get<PupilSummary>(`/pupils/${pupilId}`),
};
