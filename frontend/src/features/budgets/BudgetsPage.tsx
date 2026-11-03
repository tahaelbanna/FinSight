import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBudgets, useBudgetSummary } from './hooks/useBudgets';
import type { BudgetItem } from './types/budgets.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { CreateBudgetModal } from './components/CreateBudgetModal';
import { EditBudgetModal } from './components/EditBudgetModal';
import { BudgetDetailsModal } from './components/BudgetDetailsModal';
import { BudgetAllocationCards } from './components/BudgetAllocationCards';
import {
  Plus,
  Building,
  Briefcase,
  Eye,
  Edit2,
  PieChart,
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth();
  const isFinanceOfficer = user?.role === 'finance_officer';

  const [page, setPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'department' | 'project'>('all');
  const [isOverrunFilter, setIsOverrunFilter] = useState<boolean | undefined>(undefined);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBudgetForEdit, setSelectedBudgetForEdit] = useState<BudgetItem | null>(null);
  const [selectedBudgetIdForDetails, setSelectedBudgetIdForDetails] = useState<string | null>(null);

  const { data: summary, isLoading: isSummaryLoading } = useBudgetSummary();

  const { data, isLoading, error } = useBudgets({
    page,
    limit: 10,
    scope: scopeFilter === 'all' ? undefined : scopeFilter,
    is_overrun: isOverrunFilter,
  });

  const budgets = data?.data || [];
  const meta = data?.meta;

  const formatCurrency = (val: number | undefined) =>
    val != null
      ? `$${Number(val).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '$0.00';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900 dark:text-stone-100">
            Budgets Management
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Department operational budgets (OpEx) &amp; project capital investments (CapEx)
          </p>
        </div>

        {isFinanceOfficer && (
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Allocate Budget</span>
          </Button>
        )}
      </div>

      {/* Model B Allocation Cards */}
      <BudgetAllocationCards
        summary={summary}
        isLoading={isSummaryLoading}
        activeScope={scopeFilter}
        onSelectScope={(scope) => {
          setScopeFilter(scope);
          setPage(1);
        }}
      />

      {/* Scope and Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#151A2D] p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setScopeFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            All Allocations
          </button>
          <button
            onClick={() => {
              setScopeFilter('department');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              scopeFilter === 'department'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Department OpEx</span>
          </button>
          <button
            onClick={() => {
              setScopeFilter('project');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              scopeFilter === 'project'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Project CapEx</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isOverrunFilter === true}
              onChange={(e) => {
                setIsOverrunFilter(e.target.checked ? true : undefined);
                setPage(1);
              }}
              className="rounded border-stone-300 dark:border-stone-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Overrun Only</span>
          </label>
        </div>
      </div>

      {/* Budgets Table */}
      <Card className="overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs bg-white dark:bg-[#151A2D]">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-500 dark:text-stone-400">Loading budget allocations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 dark:text-rose-400">
            Failed to load budgets. Please check permissions or network connection.
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center">
            <PieChart className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              No budgets found
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
              There are no budgets matching the current scope and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50/75 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4">Target &amp; Model</th>
                  <th scope="col" className="py-3 px-4">Period</th>
                  <th scope="col" className="py-3 px-4">Allocated</th>
                  <th scope="col" className="py-3 px-4">Approved Spend</th>
                  <th scope="col" className="py-3 px-4">Remaining</th>
                  <th scope="col" className="py-3 px-4 min-w-[160px]">Utilization</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {budgets.map((b) => {
                  const isOpEx = Boolean(b.department);
                  const targetName = b.department?.name || b.project?.name || 'Unassigned';
                  const utilization = Math.min(Math.round(b.utilization_percentage), 100);

                  return (
                    <tr
                      key={b.budget_id}
                      className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          {isOpEx ? (
                            <Building className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                          ) : (
                            <Briefcase className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                          )}
                          <span>{targetName}</span>
                        </div>
                        <div className="mt-1">
                          <Badge variant={isOpEx ? 'info' : 'success'} className="text-[10px]">
                            {isOpEx ? 'Department OpEx' : 'Project CapEx'}
                          </Badge>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-stone-600 dark:text-stone-400 whitespace-nowrap">
                        {formatDate(b.start_date)} – {formatDate(b.end_date)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-stone-900 dark:text-stone-100">
                        {formatCurrency(b.allocated_amount)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(b.approved_expenses)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold">
                        <span
                          className={
                            b.remaining_budget < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {formatCurrency(b.remaining_budget)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {Number(b.utilization_percentage).toFixed(1)}%
                          </span>
                          {b.is_overrun && (
                            <Badge variant="danger" className="text-[10px] py-0 px-1">
                              Overrun
                            </Badge>
                          )}
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              b.is_overrun
                                ? 'bg-rose-500'
                                : b.utilization_percentage > 90
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedBudgetIdForDetails(b.budget_id)}
                            className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                            title="View Details"
                            aria-label={`View details for budget ${targetName}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isFinanceOfficer && (
                            <button
                              onClick={() => setSelectedBudgetForEdit(b)}
                              className="p-1.5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                              title="Edit Budget"
                              aria-label={`Edit budget for ${targetName}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && (
          <div className="p-4 bg-white dark:bg-[#151A2D] border-t border-stone-100 dark:border-stone-800">
            <Pagination
              meta={meta}
              currentPage={page}
              onPageChange={(p) => setPage(p)}
              isLoading={isLoading}
            />
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateBudgetModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <EditBudgetModal
        budget={selectedBudgetForEdit}
        isOpen={Boolean(selectedBudgetForEdit)}
        onClose={() => setSelectedBudgetForEdit(null)}
      />

      <BudgetDetailsModal
        budgetId={selectedBudgetIdForDetails}
        isOpen={Boolean(selectedBudgetIdForDetails)}
        onClose={() => setSelectedBudgetIdForDetails(null)}
      />
    </div>
  );
};
