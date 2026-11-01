import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { budgetsService } from '../services/budgetsService';
import type {
  CreateBudgetPayload,
  GetAllBudgetsParams,
  UpdateBudgetPayload,
} from '../types/budgets.types';

export const BUDGET_QUERY_KEYS = {
  all: ['budgets'] as const,
  lists: () => [...BUDGET_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetAllBudgetsParams) => [...BUDGET_QUERY_KEYS.lists(), params] as const,
  details: () => [...BUDGET_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BUDGET_QUERY_KEYS.details(), id] as const,
};

export function useBudgets(params: GetAllBudgetsParams = {}) {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.list(params),
    queryFn: () => budgetsService.getAll(params),
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: BUDGET_QUERY_KEYS.detail(id),
    queryFn: () => budgetsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) => budgetsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBudgetPayload }) =>
      budgetsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEYS.detail(variables.id) });
    },
  });
}
