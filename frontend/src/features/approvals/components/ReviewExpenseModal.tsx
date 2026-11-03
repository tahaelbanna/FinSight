import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { useToast } from '@/components/feedback/Toast';
import { useReviewExpense } from '../hooks/useApprovals';
import type { ExpenseItem } from '@/features/expenses/types/expenses.types';
import { extractApiErrors } from '@/services/api/errorExtractor';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Building2,
  FolderKanban,
  User,
  Calendar,
} from 'lucide-react';

interface ReviewExpenseModalProps {
  expense: ExpenseItem | null;
  onClose: () => void;
}

export const ReviewExpenseModal: React.FC<ReviewExpenseModalProps> = ({
  expense,
  onClose,
}) => {
  const { showSuccess } = useToast();
  const [comment, setComment] = useState('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reviewMutation = useReviewExpense();

  if (!expense) return null;

  const handleReview = async (decision: 'approved' | 'rejected') => {
    setGeneralError(null);
    setValidationError(null);

    if (decision === 'rejected' && !comment.trim()) {
      setValidationError('A rejection reason comment is mandatory when rejecting an expense.');
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        expenseId: expense.expense_id,
        payload: {
          decision,
          comment: comment.trim() || undefined,
        },
      });

      showSuccess(
        decision === 'approved'
          ? 'Expense approved successfully and budget allocated.'
          : 'Expense rejected and notification sent to employee.'
      );
      setComment('');
      onClose();
    } catch (err) {
      const extracted = extractApiErrors(err);
      if (extracted.generalErrors.length > 0) {
        setGeneralError(extracted.generalErrors.join('. '));
      } else {
        setGeneralError('Failed to record review decision. Please try again.');
      }
    }
  };

  return (
    <Modal
      isOpen={!!expense}
      onClose={onClose}
      title="Review Expense Submission"
      subtitle={`Review request by ${expense.submitted_by.full_name}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {generalError && <Alert variant="danger">{generalError}</Alert>}

        {/* Expense Summary Header */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">
              Claim Amount
            </span>
            <h3 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-display">
              ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="text-end">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Category</span>
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
              {expense.category.category_name}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/40">
            <span className="text-stone-400 dark:text-stone-500 font-medium flex items-center gap-1.5 mb-0.5">
              <User className="w-3.5 h-3.5" /> Submitter
            </span>
            <p className="font-semibold text-stone-900 dark:text-stone-100">{expense.submitted_by.full_name}</p>
          </div>

          <div className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/40">
            <span className="text-stone-400 dark:text-stone-500 font-medium flex items-center gap-1.5 mb-0.5">
              <Calendar className="w-3.5 h-3.5" /> Date
            </span>
            <p className="font-semibold text-stone-900 dark:text-stone-100">
              {new Date(expense.expense_date).toLocaleDateString()}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/40">
            <span className="text-stone-400 dark:text-stone-500 font-medium flex items-center gap-1.5 mb-0.5">
              <Building2 className="w-3.5 h-3.5" /> Department
            </span>
            <p className="font-semibold text-stone-900 dark:text-stone-100">{expense.department.department_name}</p>
          </div>

          <div className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/40">
            <span className="text-stone-400 dark:text-stone-500 font-medium flex items-center gap-1.5 mb-0.5">
              <FolderKanban className="w-3.5 h-3.5" /> Allocation Type
            </span>
            <p className="font-semibold text-stone-900 dark:text-stone-100">
              {expense.project ? `CapEx: ${expense.project.project_name}` : 'OpEx (Department)'}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-900/40 text-xs">
          <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block mb-1">
            Justification & Description
          </span>
          <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
            {expense.description}
          </p>
        </div>

        {/* Attachments */}
        {expense.attachments?.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 block">
              Receipts ({expense.attachments.length})
            </span>
            {expense.attachments.map((att) => (
              <div
                key={att.attachment_id}
                className="flex items-center justify-between p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/40 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate text-stone-800 dark:text-stone-200">{att.file_name}</span>
                </div>
                <a
                  href={`/api/v1/expenses/${expense.expense_id}/attachments/${att.attachment_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.file_name}
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold shrink-0 ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>View</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Reviewer Comment Box */}
        <div className="flex flex-col gap-1.5 text-start pt-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Manager Review Comment / Rejection Reason
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setValidationError(null);
            }}
            placeholder="Add comments or explanation (mandatory if rejecting)..."
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
          />
          {validationError && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{validationError}</p>
          )}
        </div>

        {/* Decision Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={reviewMutation.isPending}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={reviewMutation.isPending}
              isLoading={reviewMutation.isPending}
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={() => handleReview('rejected')}
            >
              Reject Expense
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={reviewMutation.isPending}
              isLoading={reviewMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => handleReview('approved')}
            >
              Approve Expense
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
