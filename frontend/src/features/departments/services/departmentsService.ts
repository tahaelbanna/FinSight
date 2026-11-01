import { apiClient } from '@/services/api/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';

export interface DepartmentItem {
  department_id: string;
  department_name: string;
  description: string;
  manager: {
    manager_id: string;
    manager_name: string;
  } | null;
  usersCount?: number;
  created_at: string;
  updated_at: string;
}

export interface GetAllDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  manager_id?: string;
}

export const departmentsService = {
  async getAll(params: GetAllDepartmentsParams = {}): Promise<PaginatedResponse<DepartmentItem>> {
    const response = await apiClient.get('/departments', {
      params,
    });
    return normalizePaginatedResponse<DepartmentItem>(response.data);
  },

  async getById(id: string): Promise<DepartmentItem> {
    const response = await apiClient.get<ApiResponse<DepartmentItem>>(`/departments/${id}`);
    return response.data.data;
  },

  async create(body: { department_name: string; description: string; manager_id: string }): Promise<DepartmentItem> {
    const response = await apiClient.post<ApiResponse<DepartmentItem>>('/departments', body);
    return response.data.data;
  },

  async update(id: string, body: { department_name?: string; description?: string; manager_id?: string }): Promise<DepartmentItem> {
    const response = await apiClient.patch<ApiResponse<DepartmentItem>>(`/departments/${id}`, body);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  },
};
