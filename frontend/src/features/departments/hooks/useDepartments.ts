import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departmentsService,
  type GetAllDepartmentsParams,
} from '../services/departmentsService';

export const DEPARTMENT_QUERY_KEYS = {
  all: ['departments'] as const,
  lists: () => [...DEPARTMENT_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetAllDepartmentsParams) => [...DEPARTMENT_QUERY_KEYS.lists(), params] as const,
  details: () => [...DEPARTMENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...DEPARTMENT_QUERY_KEYS.details(), id] as const,
};

export function useDepartments(params: GetAllDepartmentsParams = {}) {
  return useQuery({
    queryKey: DEPARTMENT_QUERY_KEYS.list(params),
    queryFn: () => departmentsService.getAll(params),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: DEPARTMENT_QUERY_KEYS.detail(id),
    queryFn: () => departmentsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { department_name: string; description: string; manager_id: string }) =>
      departmentsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { department_name?: string; description?: string; manager_id?: string };
    }) => departmentsService.update(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => departmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}
