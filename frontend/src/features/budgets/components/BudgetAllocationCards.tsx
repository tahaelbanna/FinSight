import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { BudgetSummaryResponse } from '../types/budgets.types';
import { Layers, Building, Briefcase, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetAllocationCardsProps {
  summary?: BudgetSummaryResponse;
  isLoading: boolean;
  activeScope: 'all' | 'department' | 'project';
  onSelectScope: (scope: 'all' | 'department' | 'project') => void;
}

export const BudgetAllocationCards: React.FC<BudgetAllocationCardsProps> = ({
  summary,
  isLoading,
  activeScope,
  onSelectScope,
}) => {
  const formatCurrency = (val: number | undefined) =>
    val != null
      ? `$${Number(val).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '$0.00';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-5 animate-pulse bg-white dark:bg-[#151A2D] border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800" />
              <div className="w-16 h-5 rounded-md bg-stone-100 dark:bg-stone-800" />
            </div>
            <div className="w-24 h-3 bg-stone-100 dark:bg-stone-800 rounded-sm mb-2" />
            <div className="w-36 h-7 bg-stone-100 dark:bg-stone-800 rounded-md mb-3" />
            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full" />
          </Card>
        ))}
      </div>
    );
  }

  const all = summary?.all_allocations;
  const opex = summary?.department_opex;
  const capex = summary?.project_capex;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. All Allocations Card */}
      <Card
        onClick={() => onSelectScope('all')}
        className={`p-5 cursor-pointer transition-all border text-start ${
          activeScope === 'all'
            ? 'ring-2 ring-indigo-600 border-indigo-300 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-sm'
            : 'border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#151A2D] hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <Badge variant={activeScope === 'all' ? 'indigo' : 'neutral'} size="sm">
            {all?.total_budgets_count || 0} Envelopes
          </Badge>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
          All Allocations (Model B Consolidated)
        </span>
        <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-stone-100 mt-1">
          {formatCurrency(all?.total_budget)}
        </p>

        {/* Spend & Remaining details */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] uppercase font-semibold block">Approved Spend</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{formatCurrency(all?.total_approved_spend)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] uppercase font-semibold block">Remaining</span>
            <span className={`font-bold ${(all?.remaining_budget ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(all?.remaining_budget)}
            </span>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-stone-500 dark:text-stone-400 font-medium">Overall Utilization</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{all?.utilization_percentage?.toFixed(1) ?? '0.0'}%</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(all?.utilization_percentage || 0, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 2. Department OpEx Card */}
      <Card
        onClick={() => onSelectScope('department')}
        className={`p-5 cursor-pointer transition-all border text-start ${
          activeScope === 'department'
            ? 'ring-2 ring-indigo-600 border-indigo-300 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-sm'
            : 'border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#151A2D] hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <Badge variant={activeScope === 'department' ? 'indigo' : 'neutral'} size="sm">
            {opex?.total_budgets_count || 0} OpEx Budgets
          </Badge>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
          Department OpEx (Direct Overhead)
        </span>
        <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-stone-100 mt-1">
          {formatCurrency(opex?.total_budget)}
        </p>

        {/* Spend & Remaining details */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] uppercase font-semibold block">Approved Spend</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(opex?.total_approved_spend)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] uppercase font-semibold block">Remaining</span>
            <span className={`font-bold ${(opex?.remaining_budget ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(opex?.remaining_budget)}
            </span>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-stone-500 dark:text-stone-400 font-medium">OpEx Utilization</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{opex?.utilization_percentage?.toFixed(1) ?? '0.0'}%</span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(opex?.utilization_percentage || 0, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 3. Project CapEx Card */}
      <Card
        onClick={() => onSelectScope('project')}
        className={`p-5 cursor-pointer transition-all border text-start ${
          activeScope === 'project'
            ? 'ring-2 ring-indigo-600 border-indigo-300 dark:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-sm'
            : 'border-stone-200/90 dark:border-stone-800 bg-white dark:bg-[#151A2D] hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-2xs'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Briefcase className="w-4 h-4" />
          </div>
          {capex?.is_overrun ? (
            <Badge variant="danger" size="sm" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>CapEx Overrun</span>
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              <span>Healthy</span>
            </Badge>
          )}
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
          Project CapEx (Strategic Investments)
        </span>
        <p className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-stone-100 mt-1">
          {formatCurrency(capex?.total_budget)}
        </p>

        {/* Spend & Remaining details */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] uppercase font-semibold block">Approved Spend</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">{formatCurrency(capex?.total_approved_spend)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] uppercase font-semibold block">Variance</span>
            <span className={`font-bold ${(capex?.remaining_budget ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(capex?.remaining_budget)}
            </span>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-stone-500 dark:text-stone-400 font-medium">CapEx Utilization</span>
            <span className={`font-bold ${capex?.is_overrun ? 'text-rose-600' : 'text-stone-800 dark:text-stone-200'}`}>
              {capex?.utilization_percentage?.toFixed(1) ?? '0.0'}%
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all ${
                capex?.is_overrun ? 'bg-rose-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(capex?.utilization_percentage || 0, 100)}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
