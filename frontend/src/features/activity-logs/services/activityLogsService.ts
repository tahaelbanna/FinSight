import { apiClient } from '@/services/api/apiClient';
import type { PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';
import type {
  ActivityLogItem,
  GetActivityLogsParams,
} from '../types/activityLogs.types';

export const activityLogsService = {
  async getAll(params: GetActivityLogsParams = {}): Promise<PaginatedResponse<ActivityLogItem>> {
    const response = await apiClient.get('/activity-logs', {
      params,
    });
    return normalizePaginatedResponse<ActivityLogItem>(response.data);
  },
};
