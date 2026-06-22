/**
 * src/hooks/useCreateMessage.ts
 * Mutation for teachers to compose a new booklet entry.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateMessageDto } from '@schoolbridge/types';
import { messagesApi } from '../api';

export function useCreateMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMessageDto) => messagesApi.createMessage(dto),
    onSuccess: () => {
      // Refresh any open pupil feeds and the teacher's homework status.
      void qc.invalidateQueries({ queryKey: ['pupilFeed'] });
      void qc.invalidateQueries({ queryKey: ['homeworkStatus'] });
    },
  });
}
