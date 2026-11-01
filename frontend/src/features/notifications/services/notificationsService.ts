import { apiClient } from '@/services/api/apiClient';
import type { PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';
import type {
  GetNotificationsParams,
  NotificationItem,
} from '../types/notifications.types';

export const notificationsService = {
  async getAll(params: GetNotificationsParams = {}): Promise<PaginatedResponse<NotificationItem>> {
    const response = await apiClient.get('/notifications', {
      params,
    });
    return normalizePaginatedResponse<NotificationItem>(response.data);
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },
};
