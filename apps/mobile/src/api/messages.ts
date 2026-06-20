/**
 * src/api/messages.ts
 * Message-related API calls.
 */
import type { CreateMessageDto, MessageReceiptView, Paginated } from '@schoolbridge/types';
import type { MessageType } from '@schoolbridge/types';
import { api } from './client';

/** A single digital-booklet entry returned by the API */
export interface MessageItem {
  id: string;
  type: MessageType;
  title: string;
  body: string | null;
  attachments: string[];
  dueAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
  };
  receipt: MessageReceiptView | null;
  replyCount: number;
}

export interface ReplyItem {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
  };
}

export const messagesApi = {
  /** Paginated feed for a specific pupil (parent view) */
  getPupilFeed: (
    pupilId: string,
    cursor?: string,
  ): Promise<Paginated<MessageItem>> =>
    api.get(`/pupils/${pupilId}/messages`, {
      ...(cursor ? { headers: { 'x-cursor': cursor } } : {}),
    }),

  /** Single message detail */
  getMessage: (messageId: string): Promise<MessageItem> =>
    api.get(`/messages/${messageId}`),

  /** Threaded replies on a message */
  getReplies: (
    messageId: string,
    cursor?: string,
  ): Promise<Paginated<ReplyItem>> =>
    api.get(
      `/messages/${messageId}/replies${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),

  /** Post a reply */
  postReply: (messageId: string, body: string): Promise<ReplyItem> =>
    api.post(`/messages/${messageId}/replies`, { body }),

  /** Acknowledge a message (parent confirms they read it) */
  acknowledge: (messageId: string): Promise<void> =>
    api.post(`/messages/${messageId}/acknowledge`),

  /** Teacher: create a new message / booklet entry */
  createMessage: (dto: CreateMessageDto): Promise<MessageItem> =>
    api.post('/messages', dto),
};
