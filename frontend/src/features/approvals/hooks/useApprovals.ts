import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsService, type ReviewExpensePayload } from '../services/approvalsService';
import { EXPENSES_QUERY_KEYS } from '@/features/expenses/hooks/useExpenses';

export const APPROVALS_QUERY_KEYS = {
  all: ['approvals'] as const,
  pending: (page: number, limit: number) => ['approvals', 'pending', page, limit] as const,
};

export function usePendingApprovals(page = 1, limit = 10) {
  return useQuery({
    queryKey: APPROVALS_QUERY_KEYS.pending(page, limit),
    queryFn: () => approvalsService.getPending(page, limit),
  });
}

export function useReviewExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: ReviewExpensePayload;
    }) => approvalsService.reviewExpense(expenseId, payload),
    onSuccess: () => {
      // Invalidate both approvals and expenses queries
      queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
