/**
 * src/hooks/useTeacher.ts
 * Teacher-facing reads/writes: inbox threads, homework status, homework submit.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api';
import { useAuthStore } from '../store/authStore';

export function useInbox() {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['inbox', schoolId],
    enabled: !!schoolId,
    queryFn: () => messagesApi.getInbox(),
    staleTime: 1000 * 30,
  });
}

export function useHomeworkStatus(classId: string | null) {
  const schoolId = useAuthStore((s) => s.schoolId);
  return useQuery({
    queryKey: ['homeworkStatus', schoolId, classId],
    enabled: !!schoolId && !!classId,
    queryFn: () => messagesApi.getHomeworkStatus(classId as string),
    staleTime: 1000 * 60,
  });
}

export function useSubmitHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, pupilId }: { messageId: string; pupilId: string }) =>
      messagesApi.submitHomework(messageId, pupilId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pupilFeed'] });
      void qc.invalidateQueries({ queryKey: ['homeworkStatus'] });
    },
  });
}
