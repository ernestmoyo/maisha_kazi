import api from './axios';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export function getNotifications(params?: NotificationParams) {
  return api.get<{ notifications: Notification[]; total: number }>(
    '/notifications',
    { params },
  );
}

export function getUnreadCount() {
  return api.get<{ count: number }>('/notifications/unread-count');
}

export function markAsRead(id: string) {
  return api.patch<Notification>(`/notifications/${id}/read`);
}

export function markAllAsRead() {
  return api.patch<void>('/notifications/read-all');
}
