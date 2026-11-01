import { apiClient } from '@/services/api/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';
import type {
  CreateUserPayload,
  GetAllUsersParams,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserItem,
} from '../types/users.types';

export const usersService = {
  async getAll(params: GetAllUsersParams = {}): Promise<PaginatedResponse<UserItem>> {
    const response = await apiClient.get('/users', {
      params,
    });
    return normalizePaginatedResponse<UserItem>(response.data);
  },

  async getById(id: string): Promise<UserItem> {
    const response = await apiClient.get<ApiResponse<UserItem>>(`/users/${id}`);
    return response.data.data;
  },

  async create(payload: CreateUserPayload): Promise<UserItem> {
    const response = await apiClient.post<ApiResponse<UserItem>>('/users', payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateUserPayload): Promise<UserItem> {
    const response = await apiClient.patch<ApiResponse<UserItem>>(`/users/${id}`, payload);
    return response.data.data;
  },

  async updateStatus(id: string, payload: UpdateUserStatusPayload): Promise<UserItem> {
    const response = await apiClient.patch<ApiResponse<UserItem>>(`/users/${id}/status`, payload);
    return response.data.data;
  },
};
