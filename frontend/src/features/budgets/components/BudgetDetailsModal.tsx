import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBudget } from '../hooks/useBudgets';
import { Calendar, AlertTriangle, User, Building, Briefcase } from 'lucide-react';

interface BudgetDetailsModalProps {
  budgetId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetDetailsModal: React.FC<BudgetDetailsModalProps> = ({
  budgetId,
  isOpen,
  onClose,
}) => {
  const { data: budget, isLoading, error } = useBudget(budgetId || '');

  if (!isOpen) return null;

  const formatCurrency = (val: number | undefined) =>
    val != null ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOpEx = Boolean(budget?.department);
  const scopeName = budget?.department?.name || budget?.project?.name || 'Unknown Target';

  const getUtilizationBadge = (level: string = '', isOverrun: boolean = false) => {
    if (isOverrun) return <Badge variant="danger">Overrun</Badge>;
    if (level === 'critical') return <Badge variant="danger">Critical (&gt;90%)</Badge>;
    if (level === 'warning' || level === 'moderate') return <Badge variant="warning">Warning (&gt;75%)</Badge>;
    return <Badge variant="success">Healthy</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Budget Allocation Details" maxWidth="xl">
      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || !budget ? (
        <div className="py-8 text-center text-rose-500">
          Failed to load budget details. Please try again.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-lg ${
                  isOpEx
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}
              >
                {isOpEx ? <Building className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    {scopeName}
                  </h3>
                  <Badge variant={isOpEx ? 'info' : 'success'}>
                    {isOpEx ? 'Department OpEx' : 'Project CapEx'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {formatDate(budget.start_date)} – {formatDate(budget.end_date)}
                  </span>
                </div>
              </div>
            </div>

            <div>{getUtilizationBadge(budget.utilization_level, budget.is_overrun)}</div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Allocated Budget
              </span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-display mt-1">
                {formatCurrency(budget.allocated_amount)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Approved Spend
              </span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-display mt-1">
                {formatCurrency(budget.approved_expenses)}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Remaining Balance
              </span>
              <p
                className={`text-xl font-bold font-display mt-1 ${
                  budget.remaining_budget < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(budget.remaining_budget)}
              </p>
            </div>
          </div>

          {/* Progress / Utilization bar */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Budget Utilization
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {Number(budget.utilization_percentage).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  budget.is_overrun
                    ? 'bg-rose-500'
                    : budget.utilization_percentage > 90
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
              />
            </div>
            {budget.is_overrun && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                This budget has exceeded allocated limits by {formatCurrency(Math.abs(budget.remaining_budget))}.
              </p>
            )}
          </div>

          {/* Recent Approved Expenses */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Recent Approved Expenses in Period
            </h4>
            {budget.recent_expenses && budget.recent_expenses.length > 0 ? (
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {budget.recent_expenses.map((expense) => (
                  <div
                    key={expense.expense_id}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {expense.category?.category_name || 'General Expense'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(expense.expense_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </p>
                      <Badge variant="success" className="text-[10px] py-0">
                        Approved
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                No approved expenses recorded for this period yet.
              </p>
            )}
          </div>

          {/* Footer Metadata */}
          {budget.created_by && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <User className="w-3.5 h-3.5" />
              <span>Created by {budget.created_by.full_name}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
