import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDepartments } from '@/features/departments/hooks/useDepartments';
import { useProjects } from '@/features/projects/hooks/useProjects';
import type { AnalyticsFilterParams } from '../types/analytics.types';
import {
  Filter,
  RotateCcw,
  Calendar,
  Building2,
  FolderKanban,
  Check,
} from 'lucide-react';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterParams;
  onFilterChange: (filters: AnalyticsFilterParams) => void;
  onReset: () => void;
  userRole?: string;
  userDepartmentId?: string;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  userRole,
  userDepartmentId,
}) => {
  const isManager = userRole === 'manager';
  const isEmployee = userRole === 'employee';

  // Fetch departments (for Admin & Finance Officer)
  const { data: deptData } = useDepartments({ limit: 100 });
  const departments = deptData?.data || [];

  // Fetch projects (optionally filtered by department)
  const effectiveDeptId = isManager ? userDepartmentId : filters.department_id;
  const { data: projData } = useProjects({
    limit: 100,
    department_id: effectiveDeptId,
  });
  const projects = projData?.data || [];

  const hasActiveFilters = Boolean(
    filters.department_id ||
    filters.project_id ||
    filters.date_from ||
    filters.date_to
  );

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value || undefined;
    onFilterChange({
      ...filters,
      department_id: deptId,
      project_id: undefined, // Reset project if department changes
    });
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value || undefined;
    onFilterChange({
      ...filters,
      project_id: projId,
    });
  };

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const applyPreset = (preset: 'all' | '2025' | '2024' | 'last6mo') => {
    if (preset === 'all') {
      onFilterChange({
        ...filters,
        date_from: undefined,
        date_to: undefined,
      });
      return;
    }

    if (preset === '2025') {
      onFilterChange({
        ...filters,
        date_from: '2025-01-01',
        date_to: '2025-12-31',
      });
      return;
    }

    if (preset === '2024') {
      onFilterChange({
        ...filters,
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      });
      return;
    }

    if (preset === 'last6mo') {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      onFilterChange({
        ...filters,
        date_from: sixMonthsAgo.toISOString().split('T')[0],
        date_to: now.toISOString().split('T')[0],
      });
    }
  };

  return (
    <Card className="p-4 sm:p-5 bg-white border border-stone-200/90 shadow-xs">
      <div className="flex flex-col gap-4">
        {/* Top Header & Preset Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 tracking-tight font-display">
                Executive Scope & Date Filters
              </h3>
              <p className="text-[11px] text-stone-500">
                Synchronized across all financial summary, trend, and breakdown queries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-stone-500 mr-1 hidden sm:inline">
              Period:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                !filters.date_from && !filters.date_to
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2025')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                filters.date_from === '2025-01-01' && filters.date_to === '2025-12-31'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              FY 2025
            </button>
            <button
              type="button"
              onClick={() => applyPreset('2024')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                filters.date_from === '2024-01-01' && filters.date_to === '2024-12-31'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              FY 2024
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last6mo')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Recent 6M
            </button>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="ml-2 h-7 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Department Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <span>Department</span>
              {isManager && (
                <Badge variant="indigo" size="sm" className="text-[9px] py-0 px-1 ml-auto">
                  Scoped
                </Badge>
              )}
            </label>
            {isEmployee ? (
              <div className="px-3 py-2 text-xs text-stone-500 bg-stone-100 rounded-xl border border-stone-200">
                Personal Submissions Scope
              </div>
            ) : isManager ? (
              <div className="px-3 py-2 text-xs font-medium text-stone-800 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <span>Managed Department</span>
                <Check className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            ) : (
              <select
                value={filters.department_id || ''}
                onChange={handleDepartmentChange}
                className="w-full text-xs rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
              >
                <option value="">All Departments (Consolidated)</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Project Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-stone-400" />
              <span>Project (CapEx)</span>
            </label>
            {isEmployee ? (
              <div className="px-3 py-2 text-xs text-stone-500 bg-stone-100 rounded-xl border border-stone-200">
                All Projects
              </div>
            ) : (
              <select
                value={filters.project_id || ''}
                onChange={handleProjectChange}
                className="w-full text-xs rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
              >
                <option value="">All Projects (Consolidated)</option>
                {projects.map((p) => (
                  <option key={p.project_id} value={p.project_id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date From */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>From Date</span>
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleDateChange('date_from', e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>To Date</span>
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleDateChange('date_to', e.target.value)}
              className="w-full text-xs rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors shadow-2xs"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
