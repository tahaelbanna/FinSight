import React, { useState } from 'react';
import { usePendingApprovals } from './hooks/useApprovals';
import type { ExpenseItem } from '@/features/expenses/types/expenses.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ReviewExpenseModal } from './components/ReviewExpenseModal';
import {
  CheckSquare,
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

  const { data: pendingData, isLoading, isError, error } = usePendingApprovals(page, 10);

  const pendingExpenses = pendingData?.data || [];
  const meta = pendingData?.meta;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="indigo" size="md">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Manager Authorization Queue
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight font-display">
            Pending Expense Approvals
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Review and adjudicate operational and project expense claims submitted by your department staff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{meta?.total || 0} Claims Awaiting Decision</span>
          </div>
        </div>
      </div>

      {/* Main Approvals Table */}
      <Card className="overflow-hidden border-stone-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/70 border-b border-stone-200/80 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 px-4 text-start">Date</th>
                <th className="py-3 px-4 text-start">Submitter</th>
                <th className="py-3 px-4 text-start">Category</th>
                <th className="py-3 px-4 text-start">Scope</th>
                <th className="py-3 px-4 text-end">Claim Amount</th>
                <th className="py-3 px-4 text-center">Receipts</th>
                <th className="py-3 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckSquare className="w-6 h-6 animate-pulse text-indigo-500" />
                      <span>Loading pending approvals queue...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-red-600">
                    Failed to load approvals. {(error as any)?.message}
                  </td>
                </tr>
              ) : pendingExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                      <p className="font-semibold text-stone-700">All caught up!</p>
                      <p className="text-xs text-stone-400">
                        There are no pending expenses requiring your review in this department.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingExpenses.map((expense: ExpenseItem) => (
                  <tr key={expense.expense_id} className="hover:bg-stone-50/60 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 font-medium text-stone-900 whitespace-nowrap">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>

                    {/* Submitter */}
                    <td className="py-3.5 px-4 font-semibold text-stone-900 whitespace-nowrap">
                      {expense.submitted_by.full_name}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                      {expense.category.category_name}
                    </td>

                    {/* Scope */}
                    <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">
                      {expense.project ? (
                        <span className="inline-flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          CapEx: {expense.project.project_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                          OpEx Department
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-end font-bold text-stone-900 whitespace-nowrap font-display text-sm">
                      ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Receipts count */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {expense.attachments?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                          <FileText className="w-3 h-3 text-indigo-600" />
                          {expense.attachments.length}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-end whitespace-nowrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedExpense(expense)}
                        className="h-8 px-3 text-xs gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-white border-t border-stone-100">
          <Pagination
            meta={meta}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
            isLoading={isLoading}
          />
        </div>
      </Card>

      {/* Review Modal */}
      <ReviewExpenseModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
};
