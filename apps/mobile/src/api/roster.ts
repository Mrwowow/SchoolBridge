/**
 * src/api/roster.ts
 * Classes & pupils for the teacher compose pickers.
 * These endpoints are school-scoped: /schools/:schoolId/...
 * The client injects x-school-id; the path id is read from the auth store.
 */
import { api } from './client';
import { schoolPath } from './tenant';

export interface ClassItem {
  id: string;
  name: string;
  _count?: { enrollments: number };
}

export interface RosterPupil {
  id: string;
  fullName: string;
  admissionNo: string | null;
}

interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export const rosterApi = {
  getClasses: (): Promise<ClassItem[]> => api.get<ClassItem[]>(schoolPath('/classes')),

  getClassPupils: (classId: string): Promise<RosterPupil[]> =>
    api
      .get<Paginated<RosterPupil>>(schoolPath(`/pupils?limit=100&classId=${classId}`))
      .then((r) => r.items),
};
