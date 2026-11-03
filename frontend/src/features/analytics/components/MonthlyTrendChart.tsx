import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import type { MonthlyTrendItem } from '../types/analytics.types';
import {
  formatCurrency,
  formatMonthLabel,
  ANALYTICS_COLORS,
} from '../utils/analyticsFormatters';
import { CalendarRange, TrendingUp, AlertCircle } from 'lucide-react';

interface MonthlyTrendChartProps {
  data?: MonthlyTrendItem[];
  isLoading: boolean;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data = [],
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs h-96 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-40 h-4 bg-stone-100 rounded-sm animate-pulse" />
            <div className="w-60 h-3 bg-stone-100 rounded-sm animate-pulse" />
          </div>
        </div>
        <div className="w-full h-64 bg-stone-50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    rawMonth: item.month,
    label: formatMonthLabel(item.month),
    total: Number(item.total),
  }));

  const totalSpend = chartData.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <Card className="p-6 bg-white border border-stone-200/90 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight font-display">
              Monthly Expense Trajectory
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Aggregated settled expenses chronologically over time
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/60 self-start sm:self-auto">
          <CalendarRange className="w-3.5 h-3.5 text-stone-400" />
          <span>Cumulative: {formatCurrency(totalSpend)}</span>
        </div>
      </div>

      {/* Chart Body */}
      {chartData.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
          <AlertCircle className="w-8 h-8 text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-stone-700">No Approved Expenses in Window</p>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            Zero approved expenditures were recorded in this date range. Under Accounting Model B, pending submissions in the review pipeline are not counted toward realized spend.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={ANALYTICS_COLORS.electricIndigo}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={ANALYTICS_COLORS.electricIndigo}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
                dy={6}
              />

              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(val) => formatCurrency(val, true)}
                width={50}
              />

              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-[#111322] text-white p-3 rounded-xl shadow-lg border border-stone-800 text-xs">
                        <p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">
                          {row.label}
                        </p>
                        <p className="text-base font-bold text-white mt-0.5 font-display">
                          {formatCurrency(row.total)}
                        </p>
                        <p className="text-[11px] text-indigo-300 mt-0.5">
                          Approved Claims
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke={ANALYTICS_COLORS.electricIndigo}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#indigoGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
