/**
 * FinSight Native Analytics DTOs & Types
 * Strictly aligned with NestJS Analytics Controller & DTOs
 */

export interface AnalyticsFilterParams {
  department_id?: string;
  project_id?: string;
  date_from?: string; // ISO date 'YYYY-MM-DD'
  date_to?: string;   // ISO date 'YYYY-MM-DD'
}

/**
 * GET /api/v1/analytics/summary
 * AnalyticsSummaryResponseDto
 */
export interface AnalyticsSummary {
  total_budget: number;
  total_approved_expenses: number;
  total_pending_expenses: number;
  remaining_budget: number;
  utilization_percentage: number;
}

/**
 * GET /api/v1/analytics/monthly-trend
 * MonthlyTrendResponseDto
 */
export interface MonthlyTrendItem {
  month: string; // 'YYYY-MM'
  total: number;
}

/**
 * GET /api/v1/analytics/category-breakdown
 * CategoryBreakdownResponseDto
 */
export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  total: number;
  percentage?: number; // Calculated on client from grand total
}

/**
 * GET /api/v1/analytics/department-comparison
 * DepartmentComparisonResponseDto
 */
export interface DepartmentComparisonInfo {
  department_id: string;
  department_name: string;
}

export interface DepartmentComparisonItem {
  department: DepartmentComparisonInfo;
  totalApproved: number;
  allocatedBudget: number;
  utilizationPercentage: number | null; // null when allocatedBudget is 0
  isOverrun: boolean;
}

/**
 * GET /api/v1/analytics/project-performance
 * ProjectPerformanceResponseDto
 */
export interface ProjectPerformanceItem {
  project_id: string;
  project_name: string;
  allocated_budget: number;
  total_spent: number;
  remaining_budget: number;
  utilization_percentage: number;
}
