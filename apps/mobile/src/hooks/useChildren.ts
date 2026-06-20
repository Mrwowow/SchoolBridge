/**
 * src/hooks/useChildren.ts
 * Fetches the list of pupils linked to the authenticated parent.
 */
import { useQuery } from '@tanstack/react-query';
import { pupilsApi } from '../api';

export const CHILDREN_KEY = ['children'] as const;

export function useChildren() {
  return useQuery({
    queryKey: CHILDREN_KEY,
    queryFn: () => pupilsApi.getMyChildren(),
    staleTime: 1000 * 60 * 5, // 5 minutes — low-bandwidth friendly
  });
}
