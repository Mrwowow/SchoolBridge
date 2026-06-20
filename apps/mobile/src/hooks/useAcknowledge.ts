/**
 * src/hooks/useAcknowledge.ts
 * Mutation to acknowledge a message; optimistically updates the cache.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, type MessageItem } from '../api';
import { messageKey } from './useMessage';

export function useAcknowledge(messageId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => messagesApi.acknowledge(messageId),

    // Optimistic update — flip acknowledged flag immediately
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: messageKey(messageId) });
      const previous = qc.getQueryData<MessageItem>(messageKey(messageId));

      qc.setQueryData<MessageItem>(messageKey(messageId), (old) => {
        if (!old) return old;
        return {
          ...old,
          receipt: old.receipt
            ? {
                ...old.receipt,
                acknowledged: true,
                acknowledgedAt: new Date().toISOString(),
              }
            : {
                delivered: true,
                read: true,
                acknowledged: true,
                readAt: new Date().toISOString(),
                acknowledgedAt: new Date().toISOString(),
              },
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(messageKey(messageId), context.previous);
      }
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: messageKey(messageId) });
    },
  });
}
