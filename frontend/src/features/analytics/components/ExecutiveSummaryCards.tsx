import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { AnalyticsSummary } from '../types/analytics.types';
import { formatCurrency, formatPercentage } from '../utils/analyticsFormatters';
import {
  Wallet,
  CheckCircle2,
  Clock,
  PiggyBank,
  Percent,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface ExecutiveSummaryCardsProps {
  summary?: AnalyticsSummary;
  isLoading: boolean;
  userRole?: string;
}

export const ExecutiveSummaryCards: React.FC<ExecutiveSummaryCardsProps> = ({
  summary,
  isLoading,
  userRole,
}) => {
  const isEmployee = userRole === 'employee';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-5 animate-pulse bg-white border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100" />
              <div className="w-12 h-5 rounded-md bg-stone-100" />
            </div>
            <div className="w-20 h-3 rounded-sm bg-stone-100 mb-2" />
            <div className="w-28 h-6 rounded-md bg-stone-100" />
          </Card>
        ))}
      </div>
    );
  }

  const totalBudget = summary?.total_budget ?? 0;
  const approved = summary?.total_approved_expenses ?? 0;
  const pending = summary?.total_pending_expenses ?? 0;
  const remaining = summary?.remaining_budget ?? 0;
  const utilization = summary?.utilization_percentage ?? 0;
  const isOverrun = totalBudget > 0 && approved > totalBudget;

  const utilizationBadgeVariant =
    totalBudget === 0
      ? 'neutral'
      : isOverrun
      ? 'danger'
      : utilization >= 80
      ? 'warning'
      : 'indigo';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Allocated Budget */}
      <Card className="p-5 bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <Badge variant="indigo" size="sm" className="text-[10px]">
            {isEmployee ? 'Dept Managed' : 'Consolidated'}
          </Badge>
        </div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Authorized Budget
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight mt-1 font-display">
          {formatCurrency(totalBudget)}
        </p>
        <p className="text-[11px] text-stone-400 mt-1.5 line-clamp-1">
          {isEmployee ? 'Company scope allocated by managers' : 'Model B OpEx & CapEx Combined'}
        </p>
      </Card>

      {/* 2. Approved Expenses (Period Spend) */}
      <Card className="p-5 bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <Badge variant="success" size="sm" className="text-[10px]">
            Realized
          </Badge>
        </div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Period Spend
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-emerald-900 tracking-tight mt-1 font-display">
          {formatCurrency(approved)}
        </p>
        <p className="text-[11px] text-stone-400 mt-1.5 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          <span>Settled & Audited Claims</span>
        </p>
      </Card>

      {/* 3. Pending Expenses */}
      <Card className="p-5 bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <Badge variant="warning" size="sm" className="text-[10px]">
            Pipeline
          </Badge>
        </div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Pending Approval
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-amber-900 tracking-tight mt-1 font-display">
          {formatCurrency(pending)}
        </p>
        <p className="text-[11px] text-stone-400 mt-1.5">
          Submitted claims awaiting review
        </p>
      </Card>

      {/* 4. Remaining Budget */}
      <Card className="p-5 bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              remaining < 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
          </div>
          {remaining < 0 && (
            <Badge variant="danger" size="sm" className="text-[10px]">
              Deficit
            </Badge>
          )}
        </div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Remaining Balance
        </p>
        <p
          className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 font-display ${
            remaining < 0 ? 'text-rose-600' : 'text-stone-900'
          }`}
        >
          {formatCurrency(remaining)}
        </p>
        <p className="text-[11px] text-stone-400 mt-1.5">
          {isEmployee ? 'Department level tracking' : 'Authorized minus period spend'}
        </p>
      </Card>

      {/* 5. Budget Utilization */}
      <Card className="p-5 bg-white border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOverrun
                ? 'bg-rose-50 text-rose-600'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            {isOverrun ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Percent className="w-4 h-4" />
            )}
          </div>
          <Badge variant={utilizationBadgeVariant} size="sm" className="text-[10px]">
            {isOverrun ? 'Overrun' : totalBudget === 0 ? 'Unbudgeted' : 'Rate'}
          </Badge>
        </div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Utilization
        </p>
        <p
          className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 font-display ${
            isOverrun ? 'text-rose-600' : 'text-stone-900'
          }`}
        >
          {totalBudget === 0 ? '0.0%' : formatPercentage(utilization)}
        </p>

        {/* Mini Utilization Bar */}
        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverrun
                ? 'bg-rose-500'
                : utilization >= 80
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </Card>
    </div>
  );
};
