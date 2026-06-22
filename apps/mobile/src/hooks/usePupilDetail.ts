/**
 * src/hooks/usePupilDetail.ts
 * Parent-facing pupil reads: day summary (today's report) and term progress.
 */
import { useQuery } from '@tanstack/react-query';
import { pupilsApi } from '../api';

export const daySummaryKey = (pupilId: string, date?: string) =>
  ['daySummary', pupilId, date ?? 'today'] as const;
export const progressKey = (pupilId: string, termId?: string) =>
  ['progress', pupilId, termId ?? 'current'] as const;

export function useDaySummary(pupilId: string | undefined, date?: string) {
  return useQuery({
    queryKey: daySummaryKey(pupilId ?? '', date),
    enabled: !!pupilId,
    queryFn: () => pupilsApi.getDaySummary(pupilId as string, date),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProgress(pupilId: string | undefined, termId?: string) {
  return useQuery({
    queryKey: progressKey(pupilId ?? '', termId),
    enabled: !!pupilId,
    queryFn: () => pupilsApi.getProgress(pupilId as string, termId),
    staleTime: 1000 * 60 * 5,
  });
}
