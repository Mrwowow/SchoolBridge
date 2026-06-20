/**
 * src/hooks/usePupilFeed.ts
 * Infinite-scroll paginated feed for a pupil's digital booklet.
 */
import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { messagesApi, type MessageItem } from '../api';
import type { Paginated } from '@schoolbridge/types';

export const pupilFeedKey = (pupilId: string) =>
  ['pupilFeed', pupilId] as const;

export function usePupilFeed(pupilId: string) {
  return useInfiniteQuery<
    Paginated<MessageItem>,
    Error,
    InfiniteData<Paginated<MessageItem>>,
    QueryKey,
    string | undefined
  >({
    queryKey: pupilFeedKey(pupilId),
    queryFn: ({ pageParam }) =>
      messagesApi.getPupilFeed(pupilId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2,
  });
}
