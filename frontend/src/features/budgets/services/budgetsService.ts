import { apiClient } from '@/services/api/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';
import type {
  BudgetItem,
  BudgetSummaryResponse,
  CreateBudgetPayload,
  GetAllBudgetsParams,
  UpdateBudgetPayload,
} from '../types/budgets.types';

export const budgetsService = {
  async getSummary(): Promise<BudgetSummaryResponse> {
    const response = await apiClient.get<ApiResponse<BudgetSummaryResponse>>('/budgets/summary');
    return response.data.data;
  },

  async getAll(params: GetAllBudgetsParams = {}): Promise<PaginatedResponse<BudgetItem>> {
    const response = await apiClient.get('/budgets', {
      params,
    });
    return normalizePaginatedResponse<BudgetItem>(response.data);
  },

  async getById(id: string): Promise<BudgetItem> {
    const response = await apiClient.get<ApiResponse<BudgetItem>>(`/budgets/${id}`);
    return response.data.data;
  },

  async create(payload: CreateBudgetPayload): Promise<BudgetItem> {
    const response = await apiClient.post<ApiResponse<BudgetItem>>('/budgets', payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateBudgetPayload): Promise<BudgetItem> {
    const response = await apiClient.patch<ApiResponse<BudgetItem>>(`/budgets/${id}`, payload);
    return response.data.data;
  },
};
