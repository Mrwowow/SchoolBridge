/**
 * src/hooks/useMessage.ts
 * Single message detail (replies are bundled in the detail response) + reply +
 * acknowledge + homework-submit mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi, type MessageDetail } from '../api';

export const messageKey = (id: string) => ['message', id] as const;

export function useMessage(messageId: string) {
  return useQuery<MessageDetail>({
    queryKey: messageKey(messageId),
    queryFn: () => messagesApi.getMessage(messageId),
    enabled: !!messageId,
    staleTime: 1000 * 60,
  });
}

export function useReply(messageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, audioUrl }: { body: string; audioUrl?: string }) =>
      messagesApi.postReply(messageId, body, audioUrl),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: messageKey(messageId) });
    },
  });
}
