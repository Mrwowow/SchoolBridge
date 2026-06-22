/**
 * src/hooks/useAcknowledge.ts
 * Mutation to acknowledge a message for a pupil; optimistically flips the
 * pupil's receipt to acknowledged.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, type MessageDetail } from '../api';
import { messageKey } from './useMessage';

export function useAcknowledge(messageId: string, pupilId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => messagesApi.acknowledge(messageId, pupilId),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: messageKey(messageId) });
      const previous = qc.getQueryData<MessageDetail>(messageKey(messageId));
      const nowIso = new Date().toISOString();

      qc.setQueryData<MessageDetail>(messageKey(messageId), (old) => {
        if (!old) return old;
        const receipts = (old.receipts ?? []).map((r) => ({
          ...r,
          read: true,
          acknowledged: true,
          readAt: r.readAt ?? nowIso,
          acknowledgedAt: nowIso,
        }));
        return { ...old, receipts };
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
