import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import type { ApiResponse } from '@/types/api.types';
import type { AuthResponseData } from '@/types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Single-flight refresh state & promise queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Listeners for auth session termination
type AuthSessionExpiredCallback = () => void;
const sessionExpiredListeners: AuthSessionExpiredCallback[] = [];

export const onAuthSessionExpired = (cb: AuthSessionExpiredCallback) => {
  sessionExpiredListeners.push(cb);
  return () => {
    const idx = sessionExpiredListeners.indexOf(cb);
    if (idx !== -1) sessionExpiredListeners.splice(idx, 1);
  };
};

const notifySessionExpired = () => {
  sessionExpiredListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Session expired callback error', e);
    }
  });
};

// 1. Request Interceptor: Inject Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Single-Flight Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If no response or already retried or not a 401 error, reject immediately
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Do NOT attempt token refresh if the failed request itself is an auth endpoint
    const url = originalRequest.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // Prevent infinite loop: retry only once
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // If another request is currently refreshing the token, enqueue this one
    if (isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      isRefreshing = false;
      tokenStorage.clearTokens();
      notifySessionExpired();
      return Promise.reject(error);
    }

    try {
      // Use raw axios to prevent recursion through interceptors
      const refreshResponse = await axios.post<ApiResponse<AuthResponseData>>(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken: currentRefreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        refreshResponse.data.data;

      // Update tokens in storage
      tokenStorage.setAccessToken(newAccessToken);
      tokenStorage.setRefreshToken(newRefreshToken);

      // Process pending queue with the new access token
      processQueue(null, newAccessToken);

      // Retry original request with new access token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clearTokens();
      notifySessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
