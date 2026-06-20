/**
 * src/api/notifications.ts
 * Push token registration and in-app notification listing.
 */
import { api } from './client';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** Deep link target within the app */
  deepLink: string | null;
}

export const notificationsApi = {
  /**
   * Register an Expo push token with the backend.
   * TODO: confirm endpoint — assumed /notifications/push-token
   */
  registerPushToken: (token: string): Promise<void> =>
    api.post('/notifications/push-token', { token, platform: 'expo' }),

  /**
   * List in-app notifications for the authenticated user.
   * TODO: confirm endpoint — assumed /notifications
   */
  listNotifications: (): Promise<AppNotification[]> =>
    api.get<AppNotification[]>('/notifications'),

  /** Mark a notification as read */
  markRead: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllRead: (): Promise<void> => api.post('/notifications/mark-all-read'),
};
