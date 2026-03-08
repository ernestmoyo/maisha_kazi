import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification, NotificationParams } from '@/api/notifications';
import * as notificationsApi from '@/api/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: NotificationParams) =>
    [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

interface NotificationsData {
  notifications: Notification[];
  total: number;
}

export function useNotifications(params?: NotificationParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async (): Promise<NotificationsData> => {
      const res = await notificationsApi.getNotifications(params);
      const d = (res.data as unknown as { data: NotificationsData }).data;
      return d;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async (): Promise<number> => {
      const res = await notificationsApi.getUnreadCount();
      return (res.data as unknown as { data: { count: number } }).data?.count ?? 0;
    },
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      notificationsApi.markAsRead(id).then((res) => (res.data as unknown as { data: Notification }).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      notificationsApi.markAllAsRead().then((res) => (res.data as unknown as { data: unknown }).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
