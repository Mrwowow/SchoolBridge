/**
 * src/hooks/useRoster.ts
 * Classes and class-scoped pupil lists for the compose pickers.
 */
import { useQuery } from '@tanstack/react-query';
import { rosterApi } from '../api';
import { useAuthStore } from '../store/authStore';

export function useClasses() {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['classes', schoolId],
    enabled: !!schoolId,
    queryFn: () => rosterApi.getClasses(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassPupils(classId: string | null) {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['classPupils', schoolId, classId],
    enabled: !!schoolId && !!classId,
    queryFn: () => rosterApi.getClassPupils(classId as string),
    staleTime: 5 * 60 * 1000,
  });
}
