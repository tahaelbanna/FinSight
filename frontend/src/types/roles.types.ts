/**
 * The four verified user roles in FinSight.
 * Strictly mirrors the backend UserRole enum (src/common/enums/user-roles.enum.ts).
 */
export type UserRole = 'admin' | 'manager' | 'finance_officer' | 'employee';

export const USER_ROLES: Record<string, UserRole> = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  FINANCE_OFFICER: 'finance_officer',
  EMPLOYEE: 'employee',
} as const;
