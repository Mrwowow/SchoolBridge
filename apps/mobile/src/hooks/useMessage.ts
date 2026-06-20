/**
 * src/hooks/useMessage.ts
 * Single message detail + replies.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { messagesApi, type MessageItem, type ReplyItem } from '../api';
import type { Paginated } from '@schoolbridge/types';

export const messageKey = (id: string) => ['message', id] as const;
export const repliesKey = (id: string) => ['replies', id] as const;

export function useMessage(messageId: string) {
  return useQuery<MessageItem>({
    queryKey: messageKey(messageId),
    queryFn: () => messagesApi.getMessage(messageId),
    staleTime: 1000 * 60,
  });
}

export function useReplies(messageId: string) {
  return useInfiniteQuery<
    Paginated<ReplyItem>,
    Error,
    InfiniteData<Paginated<ReplyItem>>,
    QueryKey,
    string | undefined
  >({
    queryKey: repliesKey(messageId),
    queryFn: ({ pageParam }) => messagesApi.getReplies(messageId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useReply(messageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagesApi.postReply(messageId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: repliesKey(messageId) });
      void qc.invalidateQueries({ queryKey: messageKey(messageId) });
    },
  });
}
