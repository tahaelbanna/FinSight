import type { UserRole } from './roles.types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface JwtUserPayload {
  sub: string;
  email: string;
  role: UserRole;
  department_id?: string | null;
  exp?: number;
  iat?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
