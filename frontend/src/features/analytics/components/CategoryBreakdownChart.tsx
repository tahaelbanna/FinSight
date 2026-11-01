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
      <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs h-96 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="w-40 h-4 bg-stone-100 rounded-sm animate-pulse" />
          <div className="w-56 h-3 bg-stone-100 rounded-sm animate-pulse" />
        </div>
        <div className="w-full h-64 bg-stone-50 rounded-xl animate-pulse" />
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
    <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-display">
              Expense Category Allocation
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Percentage share and totals across expense categories
          </p>
        </div>
      </div>

      {/* Chart Body */}
      {enrichedData.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
          <AlertCircle className="w-8 h-8 text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-stone-700">No Category Data</p>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            No expenses with approved categories found for this period.
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
                  stroke="#fff"
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
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Total
              </span>
              <span className="text-sm font-extrabold text-stone-900 font-display">
                {formatCurrency(grandTotal, true)}
              </span>
            </div>
          </div>

          {/* Detailed Category Legend / Roster */}
          <div className="w-full md:w-1/2 space-y-2 max-h-64 overflow-y-auto pr-1">
            {enrichedData.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-stone-50/70 hover:bg-stone-100/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-stone-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-stone-900 block font-display">
                    {formatCurrency(item.total)}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500">
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
