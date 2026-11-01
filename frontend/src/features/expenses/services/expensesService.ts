import { apiClient } from '@/services/api/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';
import type {
  ExpenseItem,
  ExpenseCategoryItem,
  GetAllExpensesParams,
} from '../types/expenses.types';

export const expensesService = {
  /**
   * Fetch all expenses with optional filters and pagination.
   */
  async getAll(params: GetAllExpensesParams): Promise<PaginatedResponse<ExpenseItem>> {
    const response = await apiClient.get('/expenses', {
      params,
    });
    return normalizePaginatedResponse<ExpenseItem>(response.data);
  },

  /**
   * Fetch a single expense by ID.
   */
  async getById(expenseId: string): Promise<ExpenseItem> {
    const response = await apiClient.get<ApiResponse<ExpenseItem>>(`/expenses/${expenseId}`);
    return response.data.data;
  },

  /**
   * Fetch dynamic categories from database.
   */
  async getCategories(): Promise<ExpenseCategoryItem[]> {
    const response = await apiClient.get<ApiResponse<ExpenseCategoryItem[]>>(
      '/expenses/categories'
    );
    return response.data.data;
  },

  /**
   * Submit new expense with multipart/form-data.
   */
  async submit(formData: FormData): Promise<ExpenseItem> {
    const response = await apiClient.post<ApiResponse<ExpenseItem>>('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
