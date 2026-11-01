import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import type { AnalyticsFilterParams } from '../types/analytics.types';

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  summary: (params?: AnalyticsFilterParams) => ['analytics', 'summary', params] as const,
  monthlyTrend: (params?: AnalyticsFilterParams) => ['analytics', 'monthly-trend', params] as const,
  categoryBreakdown: (params?: AnalyticsFilterParams) => ['analytics', 'category-breakdown', params] as const,
  departmentComparison: (params?: AnalyticsFilterParams) => ['analytics', 'department-comparison', params] as const,
  projectPerformance: (params?: AnalyticsFilterParams) => ['analytics', 'project-performance', params] as const,
};

/**
 * Hook for Executive Summary KPI metrics
 */
export function useAnalyticsSummary(params?: AnalyticsFilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.summary(params),
    queryFn: () => analyticsService.getSummary(params),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook for Monthly Trend Time-Series
 */
export function useMonthlyTrend(params?: AnalyticsFilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.monthlyTrend(params),
    queryFn: () => analyticsService.getMonthlyTrend(params),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for Category Breakdown
 */
export function useCategoryBreakdown(params?: AnalyticsFilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.categoryBreakdown(params),
    queryFn: () => analyticsService.getCategoryBreakdown(params),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for Department Budget & Spending Comparison
 * Restricted to Admin, Finance Officer, and Manager (Employee receives 403)
 */
export function useDepartmentComparison(params?: AnalyticsFilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.departmentComparison(params),
    queryFn: () => analyticsService.getDepartmentComparison(params),
    enabled,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error: any) => {
      // Do not retry on 403 Forbidden
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Hook for Project Performance
 * Restricted to Admin, Finance Officer, and Manager (Employee receives 403)
 */
export function useProjectPerformance(params?: AnalyticsFilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.projectPerformance(params),
    queryFn: () => analyticsService.getProjectPerformance(params),
    enabled,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error: any) => {
      // Do not retry on 403 Forbidden
      if (error?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });
}
