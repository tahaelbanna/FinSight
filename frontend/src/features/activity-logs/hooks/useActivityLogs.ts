import { useQuery } from '@tanstack/react-query';
import { activityLogsService } from '../services/activityLogsService';
import type { GetActivityLogsParams } from '../types/activityLogs.types';

export const ACTIVITY_LOG_QUERY_KEYS = {
  all: ['activity-logs'] as const,
  lists: () => [...ACTIVITY_LOG_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetActivityLogsParams) => [...ACTIVITY_LOG_QUERY_KEYS.lists(), params] as const,
};

export function useActivityLogs(params: GetActivityLogsParams = {}) {
  return useQuery({
    queryKey: ACTIVITY_LOG_QUERY_KEYS.list(params),
    queryFn: () => activityLogsService.getAll(params),
  });
}
