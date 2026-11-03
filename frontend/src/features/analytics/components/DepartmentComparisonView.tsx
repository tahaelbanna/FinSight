import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DepartmentComparisonItem } from '../types/analytics.types';
import {
  formatCurrency,
  formatPercentage,
  ANALYTICS_COLORS,
} from '../utils/analyticsFormatters';
import { Building2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface DepartmentComparisonViewProps {
  data?: DepartmentComparisonItem[];
  isLoading: boolean;
  userRole?: string;
}

export const DepartmentComparisonView: React.FC<DepartmentComparisonViewProps> = ({
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
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-stone-900 tracking-tight font-display">
            Department Financial Comparison
          </h3>
        </div>
        <p className="text-xs text-stone-500">
          Organization-wide department budget comparison is reserved for Management and Finance Officers.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs h-96 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="w-48 h-4 bg-stone-100 rounded-sm animate-pulse" />
          <div className="w-72 h-3 bg-stone-100 rounded-sm animate-pulse" />
        </div>
        <div className="w-full h-64 bg-stone-50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.department.department_name,
    allocated: Number(item.allocatedBudget),
    approved: Number(item.totalApproved),
    utilization: item.utilizationPercentage,
    isOverrun: item.isOverrun,
  }));

  return (
    <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-display">
              Department Budget vs. Actual Spend
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Model B Consolidated comparison: Authorized OpEx & CapEx budget allocations against approved period spend
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
          <AlertCircle className="w-8 h-8 text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-stone-700">No Department Data</p>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            No department records found matching active query filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recharts Bar Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  dy={8}
                  interval={0}
                  tickFormatter={(val) =>
                    val.length > 14 ? `${val.substring(0, 12)}…` : val
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(val) => formatCurrency(val, true)}
                  width={55}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const row = payload[0].payload;
                      return (
                        <div className="bg-[#111322] text-white p-3 rounded-xl shadow-lg border border-stone-800 text-xs space-y-1">
                          <p className="font-bold text-white font-display border-b border-stone-700 pb-1">
                            {row.name}
                          </p>
                          <div className="flex justify-between gap-4 pt-1">
                            <span className="text-stone-400">Authorized Budget:</span>
                            <span className="font-semibold text-white">
                              {formatCurrency(row.allocated)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-stone-400">Period Spend:</span>
                            <span className="font-semibold text-indigo-300">
                              {formatCurrency(row.approved)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-stone-700/60">
                            <span className="text-stone-400">Utilization:</span>
                            <span
                              className={`font-bold ${
                                row.isOverrun ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {row.utilization != null
                                ? formatPercentage(row.utilization)
                                : 'Unbudgeted'}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Bar
                  name="Authorized Budget"
                  dataKey="allocated"
                  fill="#CBD5E1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Bar
                  name="Period Spend"
                  dataKey="approved"
                  fill={ANALYTICS_COLORS.electricIndigo}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Comparison Data Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Department</th>
                  <th className="py-2.5 px-3.5">Authorized Budget</th>
                  <th className="py-2.5 px-3.5">Period Spend</th>
                  <th className="py-2.5 px-3.5">Utilization</th>
                  <th className="py-2.5 px-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.map((item) => (
                  <tr
                    key={item.department.department_id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="py-2.5 px-3.5 font-semibold text-stone-900">
                      {item.department.department_name}
                    </td>
                    <td className="py-2.5 px-3.5 text-stone-700">
                      {formatCurrency(item.allocatedBudget)}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-indigo-900">
                      {formatCurrency(item.totalApproved)}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {item.utilizationPercentage != null ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              item.isOverrun ? 'text-rose-600' : 'text-stone-800'
                            }`}
                          >
                            {formatPercentage(item.utilizationPercentage)}
                          </span>
                          <div className="w-16 bg-stone-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                item.isOverrun
                                  ? 'bg-rose-500'
                                  : Number(item.utilizationPercentage) >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-600'
                              }`}
                              style={{
                                width: `${Math.min(
                                  Number(item.utilizationPercentage),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic">Unbudgeted</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {item.isOverrun ? (
                        <Badge variant="danger" size="sm" className="text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1 inline" />
                          Overrun
                        </Badge>
                      ) : item.allocatedBudget > 0 ? (
                        <Badge variant="success" size="sm" className="text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                          Within Budget
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm" className="text-[10px]">
                          No Budget
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};
