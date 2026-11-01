export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface MinimalUser {
  user_id: string;
  full_name: string;
}

export interface MinimalDepartment {
  department_id: string;
  department_name: string;
}

export interface MinimalProject {
  project_id: string;
  project_name: string;
}

export interface ExpenseCategoryItem {
  category_id: string;
  category_name: string;
}

export interface ExpenseAttachment {
  attachment_id: string;
  file_name: string;
  file_path: string;
}

export interface ExpenseItem {
  expense_id: string;
  submitted_by: MinimalUser;
  department: MinimalDepartment;
  project?: MinimalProject;
  amount: number;
  category: ExpenseCategoryItem;
  description: string;
  expense_date: string;
  status: ExpenseStatus;
  reviewer?: MinimalUser;
  review_comment?: string;
  reviewed_at?: string;
  attachments: ExpenseAttachment[];
  submitted_at: string;
}

export interface GetAllExpensesParams {
  page?: number;
  limit?: number;
  status?: ExpenseStatus;
  category_id?: string;
  department_id?: string;
  project_id?: string;
  submitted_by?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}
