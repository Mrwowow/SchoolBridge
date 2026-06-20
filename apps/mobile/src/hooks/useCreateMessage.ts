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
    onSuccess: (newMsg) => {
      // Invalidate feed for the targeted pupil if target = PUPIL
      if (newMsg.type && newMsg.sender) {
        void qc.invalidateQueries({ queryKey: ['pupilFeed'] });
      }
    },
  });
}
