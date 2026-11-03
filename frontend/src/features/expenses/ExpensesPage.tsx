import React, { useState } from 'react';
import { useExpenses, useExpenseCategories } from './hooks/useExpenses';
import type { ExpenseStatus, ExpenseItem } from './types/expenses.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { CreateExpenseModal } from './components/CreateExpenseModal';
import { ExpenseDetailsModal } from './components/ExpenseDetailsModal';
import {
  Plus,
  Receipt,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ExpensesPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const { data: categories = [] } = useExpenseCategories();

  const { data: expensesData, isLoading, isError, error } = useExpenses({
    page,
    limit: 10,
    status: statusFilter,
    category_id: categoryFilter || undefined,
  });

  const expenses = expensesData?.data || [];
  const meta = expensesData?.meta;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
            Company Expenses
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Track, submit, and review operational and project expenditures across the organization.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-indigo-600/20 shrink-0"
        >
          New Expense
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { label: 'All', value: undefined },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
            ] as const
          ).map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setStatusFilter(item.value);
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer',
                statusFilter === item.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" className="dark:bg-stone-900">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id} className="dark:bg-stone-900">
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Main Expenses Table */}
      <Card className="overflow-hidden border-stone-200/80 dark:border-stone-800">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/70 dark:bg-stone-900/60 border-b border-stone-200/80 dark:border-stone-800 text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <th scope="col" className="py-3 px-4 text-start">Date</th>
                <th scope="col" className="py-3 px-4 text-start">Submitter</th>
                <th scope="col" className="py-3 px-4 text-start">Category</th>
                <th scope="col" className="py-3 px-4 text-start">Department / Project</th>
                <th scope="col" className="py-3 px-4 text-end">Amount</th>
                <th scope="col" className="py-3 px-4 text-center">Status</th>
                <th scope="col" className="py-3 px-4 text-center">Receipts</th>
                <th scope="col" className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 dark:text-stone-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-6 h-6 animate-pulse text-indigo-500" />
                      <span>Loading expense ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-red-600 dark:text-red-400">
                    Failed to load expenses. {(error as any)?.message}
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 dark:text-stone-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                      <p className="font-semibold text-stone-600 dark:text-stone-300">No expenses found</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        Try adjusting your filters or click "New Expense" to record one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense: ExpenseItem) => (
                  <tr key={expense.expense_id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>

                    {/* Submitter */}
                    <td className="py-3.5 px-4 text-stone-800 dark:text-stone-200 font-semibold whitespace-nowrap">
                      {expense.submitted_by.full_name}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                      {expense.category.category_name}
                    </td>

                    {/* Department / Scope */}
                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                      <span className="font-medium text-stone-800 dark:text-stone-200">
                        {expense.department.department_name}
                      </span>
                      {expense.project ? (
                        <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          CapEx: {expense.project.project_name}
                        </span>
                      ) : (
                        <span className="block text-[10px] text-stone-400 dark:text-stone-500">
                          OpEx (Direct)
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-end font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap font-display text-sm">
                      ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          expense.status === 'approved'
                            ? 'success'
                            : expense.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                        className="capitalize gap-1"
                      >
                        {expense.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {expense.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                        {expense.status === 'pending' && <Clock className="w-3 h-3" />}
                        <span>{expense.status}</span>
                      </Badge>
                    </td>

                    {/* Receipts count */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {expense.attachments?.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                          <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          {expense.attachments.length}
                        </span>
                      ) : (
                        <span className="text-stone-300 dark:text-stone-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-end whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedExpenseId(expense.expense_id)}
                        className="h-7 px-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-white dark:bg-[#151A2D] border-t border-stone-100 dark:border-stone-800">
          <Pagination
            meta={meta}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
            isLoading={isLoading}
          />
        </div>
      </Card>

      {/* Create Modal */}
      <CreateExpenseModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Details Modal */}
      <ExpenseDetailsModal
        expenseId={selectedExpenseId}
        onClose={() => setSelectedExpenseId(null)}
      />
    </div>
  );
};
