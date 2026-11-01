import { apiClient } from '@/services/api/apiClient';
import type { ApiResponse } from '@/types/api.types';
import type {
  AnalyticsFilterParams,
  AnalyticsSummary,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  DepartmentComparisonItem,
  ProjectPerformanceItem,
} from '../types/analytics.types';

export const analyticsService = {
  /**
   * Executive Financial Summary
   * GET /api/v1/analytics/summary
   */
  async getSummary(params?: AnalyticsFilterParams): Promise<AnalyticsSummary> {
    const response = await apiClient.get<ApiResponse<AnalyticsSummary>>('/analytics/summary', {
      params,
    });
    return response.data.data;
  },

  /**
   * Monthly Expense Time-Series Trend
   * GET /api/v1/analytics/monthly-trend
   */
  async getMonthlyTrend(params?: AnalyticsFilterParams): Promise<MonthlyTrendItem[]> {
    const response = await apiClient.get<ApiResponse<MonthlyTrendItem[]>>('/analytics/monthly-trend', {
      params,
    });
    return response.data.data;
  },

  /**
   * Expense Category Breakdown
   * GET /api/v1/analytics/category-breakdown
   */
  async getCategoryBreakdown(params?: AnalyticsFilterParams): Promise<CategoryBreakdownItem[]> {
    const response = await apiClient.get<ApiResponse<CategoryBreakdownItem[]>>('/analytics/category-breakdown', {
      params,
    });
    return response.data.data;
  },

  /**
   * Department Budget & Spending Comparison
   * GET /api/v1/analytics/department-comparison
   * Note: Excludes project_id as department comparison operates at the department scope.
   */
  async getDepartmentComparison(params?: AnalyticsFilterParams): Promise<DepartmentComparisonItem[]> {
    const { project_id: _, ...deptParams } = params || {};
    const response = await apiClient.get<ApiResponse<DepartmentComparisonItem[]>>('/analytics/department-comparison', {
      params: deptParams,
    });
    return response.data.data;
  },

  /**
   * Project Performance & CapEx Spending
   * GET /api/v1/analytics/project-performance
   */
  async getProjectPerformance(params?: AnalyticsFilterParams): Promise<ProjectPerformanceItem[]> {
    const response = await apiClient.get<ApiResponse<ProjectPerformanceItem[]>>('/analytics/project-performance', {
      params,
    });
    return response.data.data;
  },
};
