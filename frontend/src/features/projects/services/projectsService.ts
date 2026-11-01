import { apiClient } from '@/services/api/apiClient';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import { normalizePaginatedResponse } from '@/types/api.types';

export type ProjectStatus = 'planned' | 'active' | 'completed' | 'on_hold' | 'cancelled';

export interface ProjectItem {
  project_id: string;
  project_name: string;
  department: {
    department_id: string;
    department_name: string;
  };
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface GetAllProjectsParams {
  page?: number;
  limit?: number;
  department_id?: string;
  status?: ProjectStatus;
  search?: string;
}

export const projectsService = {
  async getAll(params: GetAllProjectsParams = {}): Promise<PaginatedResponse<ProjectItem>> {
    const response = await apiClient.get('/projects', {
      params,
    });
    return normalizePaginatedResponse<ProjectItem>(response.data);
  },

  async getById(id: string): Promise<ProjectItem> {
    const response = await apiClient.get<ApiResponse<ProjectItem>>(`/projects/${id}`);
    return response.data.data;
  },

  async create(body: { project_name: string; department_id: string; start_date: string; end_date: string }): Promise<ProjectItem> {
    const response = await apiClient.post<ApiResponse<ProjectItem>>('/projects', body);
    return response.data.data;
  },

  async update(id: string, body: { project_name?: string; start_date?: string; end_date?: string }): Promise<ProjectItem> {
    const response = await apiClient.patch<ApiResponse<ProjectItem>>(`/projects/${id}`, body);
    return response.data.data;
  },

  async updateStatus(id: string, status: ProjectStatus): Promise<ProjectItem> {
    const response = await apiClient.patch<ApiResponse<ProjectItem>>(`/projects/${id}/status`, {
      status,
    });
    return response.data.data;
  },
};
