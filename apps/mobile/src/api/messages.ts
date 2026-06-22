/**
 * src/api/messages.ts
 * Message / booklet API calls. All routes are school-scoped
 * (/schools/:schoolId/messages/...); the client injects x-school-id and the
 * path :schoolId is read from the auth store.
 */
import type {
  CreateMessageDto,
  MessageReceiptView,
  MessageAuthor,
  Paginated,
  MessageType,
  InboxThreadView,
  HomeworkStatusView,
} from '@schoolbridge/types';
import { api } from './client';
import { schoolPath } from './tenant';

/** A single digital-booklet entry returned by the API. */
export interface MessageItem {
  id: string;
  type: MessageType;
  title: string;
  body: string | null;
  attachments: string[];
  audioUrl: string | null;
  dueAt: string | null;
  createdAt: string;
  author: MessageAuthor;
  /** Per-pupil receipt rows (present on the pupil feed / detail). */
  receipts?: MessageReceiptView[];
  replyCount: number;
  /** HOMEWORK only: has the feed's pupil submitted. */
  submitted?: boolean;
}

export interface ReplyItem {
  id: string;
  body: string;
  audioUrl: string | null;
  createdAt: string;
  author: MessageAuthor;
}

/** Single-message detail bundles its replies (no separate replies fetch). */
export interface MessageDetail extends MessageItem {
  replies: ReplyItem[];
}

export const messagesApi = {
  /** Paginated booklet feed for a specific pupil (parent view). */
  getPupilFeed: (pupilId: string, cursor?: string): Promise<Paginated<MessageItem>> =>
    api.get(
      schoolPath(
        `/messages/pupil/${pupilId}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
      ),
    ),

  /** Single message detail (includes replies). */
  getMessage: (messageId: string): Promise<MessageDetail> =>
    api.get(schoolPath(`/messages/${messageId}`)),

  /** Post a reply (optionally a voice note). */
  postReply: (messageId: string, body: string, audioUrl?: string): Promise<ReplyItem> =>
    api.post(schoolPath(`/messages/${messageId}/replies`), { body, audioUrl }),

  /** Acknowledge a message for a specific pupil (read + confirm). */
  acknowledge: (messageId: string, pupilId: string): Promise<void> =>
    api.post(schoolPath(`/messages/${messageId}/acknowledge/${pupilId}`)),

  /** Mark a homework message submitted for a pupil. */
  submitHomework: (messageId: string, pupilId: string): Promise<{ submitted: boolean }> =>
    api.post(schoolPath(`/messages/${messageId}/submit`), { pupilId }),

  /** Teacher: create a new booklet entry. */
  createMessage: (dto: CreateMessageDto): Promise<{ id: string }> =>
    api.post(schoolPath('/messages'), dto),

  /** Teacher: conversation threads grouped by pupil. */
  getInbox: (): Promise<InboxThreadView[]> => api.get(schoolPath('/messages/inbox')),

  /** Teacher: homework submitted/total per assignment for a class. */
  getHomeworkStatus: (classId: string): Promise<HomeworkStatusView[]> =>
    api.get(schoolPath(`/messages/homework-status?classId=${classId}`)),
};
