import { apiClient } from '@/services/api/apiClient';
import type { PaginatedResponse, ApiResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';
import type { ExpenseItem, ExpenseStatus } from '@/features/expenses/types/expenses.types';

export interface ReviewExpensePayload {
  decision: ExpenseStatus; // 'approved' | 'rejected'
  comment?: string;
}

export const approvalsService = {
  /**
   * Fetch pending expenses awaiting manager approval.
   */
  async getPending(page = 1, limit = 10): Promise<PaginatedResponse<ExpenseItem>> {
    const response = await apiClient.get('/approvals/pending', {
      params: { page, limit },
    });
    return normalizePaginatedResponse<ExpenseItem>(response.data);
  },

  /**
   * Review an expense: approve or reject with mandatory comment if rejected.
   */
  async reviewExpense(
    expenseId: string,
    payload: ReviewExpensePayload
  ): Promise<ExpenseItem> {
    const response = await apiClient.patch<ApiResponse<ExpenseItem>>(
      `/approvals/expenses/${expenseId}/review`,
      payload
    );
    return response.data.data;
  },
};
