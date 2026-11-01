import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ProjectPerformanceItem } from '../types/analytics.types';
import {
  formatCurrency,
  formatPercentage,
} from '../utils/analyticsFormatters';
import { FolderKanban, AlertTriangle, AlertCircle } from 'lucide-react';

interface ProjectPerformanceViewProps {
  data?: ProjectPerformanceItem[];
  isLoading: boolean;
  userRole?: string;
}

export const ProjectPerformanceView: React.FC<ProjectPerformanceViewProps> = ({
  data = [],
  isLoading,
  userRole,
}) => {
  const isEmployee = userRole === 'employee';

  if (isEmployee) {
    return (
      <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center">
            <FolderKanban className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight font-display">
            Project Performance & CapEx Spending
          </h3>
        </div>
        <p className="text-xs text-stone-500">
          Project portfolio budget analytics are reserved for Managers and Finance Officers.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs h-96 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="w-44 h-4 bg-stone-100 rounded-sm animate-pulse" />
          <div className="w-64 h-3 bg-stone-100 rounded-sm animate-pulse" />
        </div>
        <div className="w-full h-64 bg-stone-50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-display">
              Project Performance & CapEx Spending
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Independent capital expenditure allocations, realization velocity, and overrun tracking
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
          <AlertCircle className="w-8 h-8 text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-stone-700">No Projects Found</p>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            No projects matched the selected department or date filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3.5">Project Name</th>
                <th className="py-2.5 px-3.5">Allocated CapEx</th>
                <th className="py-2.5 px-3.5">Total Spent</th>
                <th className="py-2.5 px-3.5">Remaining Balance</th>
                <th className="py-2.5 px-3.5">Utilization</th>
                <th className="py-2.5 px-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.map((item) => {
                const isOverrun =
                  item.allocated_budget > 0 && item.total_spent > item.allocated_budget;
                const utilization = Number(item.utilization_percentage);

                return (
                  <tr
                    key={item.project_id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="py-2.5 px-3.5 font-semibold text-stone-900">
                      {item.project_name}
                    </td>
                    <td className="py-2.5 px-3.5 text-stone-700">
                      {formatCurrency(item.allocated_budget)}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-indigo-900">
                      {formatCurrency(item.total_spent)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`font-semibold ${
                          item.remaining_budget < 0
                            ? 'text-rose-600'
                            : 'text-stone-800'
                        }`}
                      >
                        {formatCurrency(item.remaining_budget)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            isOverrun ? 'text-rose-600' : 'text-stone-800'
                          }`}
                        >
                          {formatPercentage(utilization)}
                        </span>
                        <div className="w-20 bg-stone-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              isOverrun
                                ? 'bg-rose-500'
                                : utilization >= 80
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{
                              width: `${Math.min(utilization, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {isOverrun ? (
                        <Badge variant="danger" size="sm" className="text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1 inline" />
                          Overrun
                        </Badge>
                      ) : item.allocated_budget > 0 ? (
                        <Badge variant="success" size="sm" className="text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm" className="text-[10px]">
                          Unbudgeted
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
