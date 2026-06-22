/**
 * src/hooks/useTeacherActions.ts
 * Subjects, terms, class report-status, attendance register, results entry,
 * and per-subject day notes — the teacher write/read surface.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BulkAttendanceDto,
  UpsertResultDto,
  UpsertDaySubjectNoteDto,
} from '@schoolbridge/types';
import { teacherApi, pupilsApi } from '../api';
import { useAuthStore } from '../store/authStore';

export function useSubjects() {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['subjects', schoolId],
    enabled: !!schoolId,
    queryFn: () => teacherApi.getSubjects(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => teacherApi.createSubject(name),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useTerms() {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['terms', schoolId],
    enabled: !!schoolId,
    queryFn: () => teacherApi.getTerms(),
    staleTime: 1000 * 60 * 30,
  });
}

/** Convenience: the current term id (or first available) for write actions. */
export function useCurrentTermId(): string | undefined {
  const { data } = useTerms();
  if (!data || data.length === 0) return undefined;
  return (data.find((t) => t.isCurrent) ?? data[0])?.id;
}

export function useReportStatus(classId: string | null, date?: string) {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['reportStatus', schoolId, classId, date ?? 'today'],
    enabled: !!schoolId && !!classId,
    queryFn: () => teacherApi.getReportStatus(classId as string, date),
    staleTime: 1000 * 30,
  });
}

export function useBulkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkAttendanceDto) => teacherApi.bulkAttendance(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['reportStatus'] });
      void qc.invalidateQueries({ queryKey: ['daySummary'] });
    },
  });
}

export function useUpsertResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpsertResultDto) => teacherApi.upsertResult(dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useUpsertDayNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pupilId, dto }: { pupilId: string; dto: UpsertDaySubjectNoteDto }) =>
      pupilsApi.upsertDayNote(pupilId, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['daySummary'] });
      void qc.invalidateQueries({ queryKey: ['reportStatus'] });
    },
  });
}
