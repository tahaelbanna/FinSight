import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import type { CategoryBreakdownItem } from '../types/analytics.types';
import {
  formatCurrency,
  formatPercentage,
  ANALYTICS_COLORS,
} from '../utils/analyticsFormatters';
import { PieChart as PieChartIcon, AlertCircle } from 'lucide-react';

interface CategoryBreakdownChartProps {
  data?: CategoryBreakdownItem[];
  isLoading: boolean;
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data = [],
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6 bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs h-96 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="w-40 h-4 bg-stone-100 dark:bg-stone-800 rounded-sm animate-pulse" />
          <div className="w-56 h-3 bg-stone-100 dark:bg-stone-800 rounded-sm animate-pulse" />
        </div>
        <div className="w-full h-64 bg-stone-50 dark:bg-stone-900/60 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const grandTotal = data.reduce((sum, item) => sum + Number(item.total), 0);

  // Compute percentages on client
  const enrichedData = data.map((item, idx) => {
    const total = Number(item.total);
    const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
    return {
      id: item.category_id,
      name: item.category_name,
      total,
      percentage,
      color: ANALYTICS_COLORS.palette[idx % ANALYTICS_COLORS.palette.length],
    };
  });

  return (
    <Card className="p-6 bg-white dark:bg-[#151A2D] border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight font-display">
              Expense Category Allocation
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Percentage share and totals across expense categories
          </p>
        </div>
      </div>

      {/* Chart Body */}
      {enrichedData.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 dark:bg-stone-900/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
          <AlertCircle className="w-8 h-8 text-stone-400 dark:text-stone-500 mb-2" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No Category Breakdown Available</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
            Zero approved expenditures found for this period. Pending claims in the review queue will populate categories upon manager approval.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Donut Chart */}
          <div className="h-64 w-full md:w-1/2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enrichedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="total"
                  stroke="transparent"
                  strokeWidth={2}
                >
                  {enrichedData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#111322] text-white p-3 rounded-xl shadow-lg border border-stone-800 text-xs">
                          <p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                            {item.name}
                          </p>
                          <p className="text-base font-bold text-white mt-0.5 font-display">
                            {formatCurrency(item.total)}
                          </p>
                          <p className="text-[11px] text-indigo-300 mt-0.5 font-medium">
                            {formatPercentage(item.percentage)} of total spend
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                Total
              </span>
              <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100 font-display">
                {formatCurrency(grandTotal, true)}
              </span>
            </div>
          </div>

          {/* Detailed Category Legend / Roster */}
          <div className="w-full md:w-1/2 space-y-2 max-h-64 overflow-y-auto pr-1">
            {enrichedData.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50/70 dark:bg-stone-900/60 hover:bg-stone-100/70 dark:hover:bg-stone-800/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-stone-800 dark:text-stone-200 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block font-display">
                    {formatCurrency(item.total)}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                    {formatPercentage(item.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
