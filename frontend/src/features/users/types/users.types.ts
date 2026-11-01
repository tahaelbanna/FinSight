export type UserRole = 'admin' | 'manager' | 'finance_officer' | 'employee';

export interface UserDepartment {
  department_id: string;
  department_name: string;
}

export interface UserItem {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: UserDepartment | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  department_id?: string;
  is_active?: boolean;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  department_id?: string;
}

export interface UpdateUserPayload {
  full_name?: string;
  role?: UserRole;
  department_id?: string;
}

export interface UpdateUserStatusPayload {
  is_active: boolean;
}
