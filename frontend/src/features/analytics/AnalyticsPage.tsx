import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  useAnalyticsSummary,
  useMonthlyTrend,
  useCategoryBreakdown,
  useDepartmentComparison,
  useProjectPerformance,
} from './hooks/useAnalytics';
import type { AnalyticsFilterParams } from './types/analytics.types';
import { AnalyticsFilterBar } from './components/AnalyticsFilterBar';
import { ExecutiveSummaryCards } from './components/ExecutiveSummaryCards';
import { MonthlyTrendChart } from './components/MonthlyTrendChart';
import { CategoryBreakdownChart } from './components/CategoryBreakdownChart';
import { DepartmentComparisonView } from './components/DepartmentComparisonView';
import { ProjectPerformanceView } from './components/ProjectPerformanceView';
import { LineChart, RefreshCw, ShieldCheck } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AnalyticsFilterParams>({});

  const isEmployee = user?.role === 'employee';

  // React Query queries (department comparison & project performance disabled for Employee)
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    refetch: refetchSummary,
  } = useAnalyticsSummary(filters);

  const {
    data: trend,
    isLoading: isTrendLoading,
    isFetching: isTrendFetching,
    refetch: refetchTrend,
  } = useMonthlyTrend(filters);

  const {
    data: categories,
    isLoading: isCategoryLoading,
    isFetching: isCategoryFetching,
    refetch: refetchCategories,
  } = useCategoryBreakdown(filters);

  const {
    data: deptComparison,
    isLoading: isDeptLoading,
    isFetching: isDeptFetching,
    refetch: refetchDept,
  } = useDepartmentComparison(filters, !isEmployee);

  const {
    data: projectPerformance,
    isLoading: isProjectLoading,
    isFetching: isProjectFetching,
    refetch: refetchProject,
  } = useProjectPerformance(filters, !isEmployee);

  const isRefreshing =
    isSummaryFetching ||
    isTrendFetching ||
    isCategoryFetching ||
    isDeptFetching ||
    isProjectFetching;

  const handleRefresh = () => {
    refetchSummary();
    refetchTrend();
    refetchCategories();
    if (!isEmployee) {
      refetchDept();
      refetchProject();
    }
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="indigo" size="md">
              <LineChart className="w-3.5 h-3.5 mr-1" />
              Native Analytics
            </Badge>
            <Badge variant="neutral" size="md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-stone-500" />
              <span className="capitalize">{user?.role?.replace('_', ' ')} Scope</span>
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-display">
            Financial Analytics & Reporting
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl">
            Live enterprise financial intelligence adhering to Model B OpEx & CapEx accounting standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-3.5 text-xs text-stone-700 bg-white hover:bg-stone-50 shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            />
            {isRefreshing ? 'Syncing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
        userRole={user?.role}
        userDepartmentId={user?.departmentId || undefined}
      />

      {/* Executive Summary Cards */}
      <ExecutiveSummaryCards
        summary={summary}
        isLoading={isSummaryLoading}
        userRole={user?.role}
      />

      {/* Row 1: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MonthlyTrendChart data={trend} isLoading={isTrendLoading} />
        </div>
        <div className="lg:col-span-5">
          <CategoryBreakdownChart
            data={categories}
            isLoading={isCategoryLoading}
          />
        </div>
      </div>

      {/* Row 2: Management Views (Department & Project Performance) */}
      {!isEmployee && (
        <div className="space-y-6">
          <DepartmentComparisonView
            data={deptComparison}
            isLoading={isDeptLoading}
            userRole={user?.role}
          />

          <ProjectPerformanceView
            data={projectPerformance}
            isLoading={isProjectLoading}
            userRole={user?.role}
          />
        </div>
      )}

      {/* Employee Context Notice */}
      {isEmployee && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              You are viewing personal submission metrics. Department comparison and project portfolio allocations are available to department managers and finance officers.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
