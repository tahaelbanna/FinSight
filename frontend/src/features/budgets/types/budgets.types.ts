export interface BudgetScopeItem {
  id: string;
  name: string;
}

export interface BudgetCreator {
  user_id: string;
  full_name: string;
}

export interface BudgetCategory {
  category_id: string;
  category_name: string;
}

export interface MinimalExpenseItem {
  expense_id: string;
  amount: number;
  expense_date: string;
  status: string;
  category: BudgetCategory | null;
}

export type UtilizationLevel = 'safe' | 'warning' | 'critical' | 'overrun' | string;

export interface BudgetItem {
  budget_id: string;
  department?: BudgetScopeItem | null;
  project?: BudgetScopeItem | null;
  allocated_amount: number;
  start_date: string;
  end_date: string;
  approved_expenses: number;
  remaining_budget: number;
  utilization_percentage: number;
  budget_variance: number;
  utilization_level: UtilizationLevel;
  is_overrun: boolean;
  created_by?: BudgetCreator | null;
  recent_expenses?: MinimalExpenseItem[];
}

export interface GetAllBudgetsParams {
  page?: number;
  limit?: number;
  scope?: 'department' | 'project';
  department_id?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
  is_overrun?: boolean;
}

export interface CreateBudgetPayload {
  department_id?: string;
  project_id?: string;
  allocated_amount: number;
  start_date: string;
  end_date: string;
}

export interface UpdateBudgetPayload {
  allocated_amount?: number;
  start_date?: string;
  end_date?: string;
}
