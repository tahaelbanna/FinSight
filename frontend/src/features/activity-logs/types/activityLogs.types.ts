export type ActionType =
  | 'EXPENSE_SUBMITTED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  | 'DEPARTMENT_CREATED'
  | 'DEPARTMENT_UPDATED'
  | 'DEPARTMENT_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'BUDGET_CREATED'
  | 'BUDGET_UPDATED';

export type EntityType = 'expense' | 'user' | 'department' | 'project' | 'budget';

export interface ActivityLogUser {
  user_id: string;
  full_name: string;
}

export interface ActivityLogItem {
  log_id: string;
  user: ActivityLogUser;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string;
  created_at: string;
}

export interface GetActivityLogsParams {
  page?: number;
  limit?: number;
  user_id?: string;
  action_type?: ActionType;
  entity_type?: EntityType;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
}
