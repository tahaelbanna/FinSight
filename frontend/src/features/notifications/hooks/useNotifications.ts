import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../services/notificationsService';
import type { GetNotificationsParams } from '../types/notifications.types';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetNotificationsParams) => [...NOTIFICATION_QUERY_KEYS.lists(), params] as const,
  unreadCount: () => [...NOTIFICATION_QUERY_KEYS.all, 'unreadCount'] as const,
};

export function useNotifications(params: GetNotificationsParams = {}) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => notificationsService.getAll(params),
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(),
    queryFn: async () => {
      const res = await notificationsService.getAll({ isRead: false, limit: 1 });
      return res.meta?.total || 0;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}
