/**
 * src/api/notifications.ts
 * Push-token registration and in-app notifications. These routes are NOT
 * school-scoped (notifications are per-user), so they use plain paths.
 */
import type { Paginated } from '@schoolbridge/types';
import { api } from './client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  /** Register an Expo push token with the backend. */
  registerPushToken: (token: string, platform?: string): Promise<{ id: string }> =>
    api.post('/notifications/push-token', { token, platform }),

  /** List in-app notifications (most recent first, cursor-paginated). */
  list: (cursor?: string): Promise<Paginated<AppNotification>> =>
    api.get(`/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),

  /** Unread count for the badge. */
  unreadCount: (): Promise<{ count: number }> => api.get('/notifications/unread-count'),

  /** Mark one notification read. */
  markRead: (id: string): Promise<void> => api.patch(`/notifications/${id}/read`),

  /** Mark all read. */
  markAllRead: (): Promise<{ updated: number }> =>
    api.post('/notifications/mark-all-read'),
};
