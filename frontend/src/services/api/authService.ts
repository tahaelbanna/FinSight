import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/api.types';
import type {
  LoginCredentials,
  AuthResponseData,
  RefreshTokenRequest,
} from '@/types/auth.types';

export const authService = {
  /**
   * Authenticate user credentials.
   * Checks both system_admins and users tables on the backend.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      credentials
    );
    return response.data.data;
  },

  /**
   * Rotates refresh token and returns fresh token pair.
   */
  async refreshToken(payload: RefreshTokenRequest): Promise<AuthResponseData> {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/refresh-token',
      payload
    );
    return response.data.data;
  },

  /**
   * Invalidates active session on the backend and deletes stored refresh tokens.
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
