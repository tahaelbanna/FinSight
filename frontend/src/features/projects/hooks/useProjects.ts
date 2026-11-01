import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  projectsService,
  type GetAllProjectsParams,
  type ProjectStatus,
} from '../services/projectsService';

export const PROJECT_QUERY_KEYS = {
  all: ['projects'] as const,
  lists: () => [...PROJECT_QUERY_KEYS.all, 'list'] as const,
  list: (params: GetAllProjectsParams) => [...PROJECT_QUERY_KEYS.lists(), params] as const,
  details: () => [...PROJECT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROJECT_QUERY_KEYS.details(), id] as const,
};

export function useProjects(params: GetAllProjectsParams = {}) {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.list(params),
    queryFn: () => projectsService.getAll(params),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.detail(id),
    queryFn: () => projectsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      project_name: string;
      department_id: string;
      start_date: string;
      end_date: string;
    }) => projectsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { project_name?: string; start_date?: string; end_date?: string };
    }) => projectsService.update(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.id) });
    },
  });
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      projectsService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.id) });
    },
  });
}
