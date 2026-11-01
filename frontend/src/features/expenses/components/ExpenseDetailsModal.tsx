import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useExpenseDetails } from '../hooks/useExpenses';
import {
  Receipt,
  Building2,
  FolderKanban,
  User,
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ExpenseDetailsModalProps {
  expenseId: string | null;
  onClose: () => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  expenseId,
  onClose,
}) => {
  const { data: expense, isLoading } = useExpenseDetails(expenseId);

  return (
    <Modal
      isOpen={!!expenseId}
      onClose={onClose}
      title="Expense Record Details"
      subtitle={expense ? `ID: ${expense.expense_id}` : undefined}
      maxWidth="lg"
    >
      {isLoading || !expense ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
          <Receipt className="w-8 h-8 animate-pulse text-indigo-500" />
          <p className="text-xs font-medium">Loading expense details...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Top Status & Amount Banner */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                Amount Incurred
              </p>
              <h2 className="text-2xl font-extrabold text-stone-900 font-display">
                ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div>
              <Badge
                variant={
                  expense.status === 'approved'
                    ? 'success'
                    : expense.status === 'rejected'
                    ? 'danger'
                    : 'warning'
                }
                size="md"
                className="capitalize gap-1.5"
              >
                {expense.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {expense.status === 'rejected' && <AlertCircle className="w-3.5 h-3.5" />}
                {expense.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                <span>{expense.status}</span>
              </Badge>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl border border-stone-100 bg-white space-y-1">
              <span className="text-stone-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Submitter
              </span>
              <p className="font-semibold text-stone-900">{expense.submitted_by.full_name}</p>
            </div>

            <div className="p-3 rounded-xl border border-stone-100 bg-white space-y-1">
              <span className="text-stone-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Department
              </span>
              <p className="font-semibold text-stone-900">{expense.department.department_name}</p>
            </div>

            <div className="p-3 rounded-xl border border-stone-100 bg-white space-y-1">
              <span className="text-stone-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Expense Date
              </span>
              <p className="font-semibold text-stone-900">
                {new Date(expense.expense_date).toLocaleDateString()}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-stone-100 bg-white space-y-1">
              <span className="text-stone-400 font-medium flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Category
              </span>
              <p className="font-semibold text-stone-900">{expense.category.category_name}</p>
            </div>

            {expense.project && (
              <div className="p-3 rounded-xl border border-stone-100 bg-white space-y-1 sm:col-span-2">
                <span className="text-stone-400 font-medium flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5" /> Linked CapEx Project
                </span>
                <p className="font-semibold text-stone-900">{expense.project.project_name}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-xl border border-stone-200/70 bg-white space-y-1 text-xs">
            <span className="text-stone-400 font-medium uppercase tracking-wider text-[10px]">
              Justification & Business Notes
            </span>
            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
              {expense.description}
            </p>
          </div>

          {/* Reviewer Details (if reviewed) */}
          {expense.reviewed_at && (
            <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">
                  Reviewed by: {expense.reviewer?.full_name || 'Department Manager'}
                </span>
                <span className="text-stone-400">
                  {new Date(expense.reviewed_at).toLocaleString()}
                </span>
              </div>
              {expense.review_comment && (
                <p className="text-stone-600 bg-white p-2.5 rounded-lg border border-stone-200/60 italic">
                  "{expense.review_comment}"
                </p>
              )}
            </div>
          )}

          {/* Attachments */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600">
              Receipt Attachments ({expense.attachments.length})
            </h4>
            {expense.attachments.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No files attached to this expense.</p>
            ) : (
              <div className="space-y-1.5">
                {expense.attachments.map((att) => (
                  <div
                    key={att.attachment_id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/70 bg-white hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-medium text-stone-800 truncate">
                        {att.file_name}
                      </span>
                    </div>
                    <a
                      href={`/api/v1/expenses/${expense.expense_id}/attachments/${att.attachment_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.file_name}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Close */}
          <div className="flex justify-end pt-3 border-t border-stone-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
