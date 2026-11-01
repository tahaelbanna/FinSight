import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '../services/expensesService';
import type { GetAllExpensesParams } from '../types/expenses.types';

export const EXPENSES_QUERY_KEYS = {
  all: ['expenses'] as const,
  list: (params: GetAllExpensesParams) => ['expenses', 'list', params] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
  categories: ['expenses', 'categories'] as const,
};

export function useExpenses(params: GetAllExpensesParams = {}) {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.list(params),
    queryFn: () => expensesService.getAll(params),
  });
}

export function useExpenseDetails(expenseId: string | null) {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.detail(expenseId || ''),
    queryFn: () => expensesService.getById(expenseId!),
    enabled: !!expenseId,
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.categories,
    queryFn: () => expensesService.getCategories(),
    staleTime: 1000 * 60 * 10, // Categories change infrequently
  });
}

export function useSubmitExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => expensesService.submit(formData),
    onSuccess: () => {
      // Invalidate expenses lists and related approval/budget queries
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
