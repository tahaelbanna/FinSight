import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { authService } from '@/services/api/authService';
import { onAuthSessionExpired } from '@/services/api/apiClient';
import { decodeJwt, isJwtExpired } from '@/lib/utils';
import type { AuthUser, AuthState, LoginCredentials, JwtUserPayload } from '@/types/auth.types';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const resolveUserFromToken = useCallback((token: string): AuthUser | null => {
    const payload = decodeJwt<JwtUserPayload>(token);
    if (!payload || !payload.sub || !payload.role) return null;
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      departmentId: payload.department_id ?? null,
    };
  }, []);

  // Initialize session on mount using refresh token from sessionStorage
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      const storedRefreshToken = tokenStorage.getRefreshToken();
      if (!storedRefreshToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      // If refresh token is already expired locally, purge session
      if (isJwtExpired(storedRefreshToken)) {
        tokenStorage.clearTokens();
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const tokens = await authService.refreshToken({
          refreshToken: storedRefreshToken,
        });

        tokenStorage.setAccessToken(tokens.accessToken);
        tokenStorage.setRefreshToken(tokens.refreshToken);

        const resolvedUser = resolveUserFromToken(tokens.accessToken);
        if (isMounted) {
          setAccessToken(tokens.accessToken);
          setUser(resolvedUser);
        }
      } catch (err) {
        console.warn('Initial session restoration failed:', err);
        tokenStorage.clearTokens();
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    // Listen for session expiry from API interceptor
    const unsubscribe = onAuthSessionExpired(() => {
      if (isMounted) {
        tokenStorage.clearTokens();
        setAccessToken(null);
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [resolveUserFromToken]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true);
      try {
        const tokens = await authService.login(credentials);
        tokenStorage.setAccessToken(tokens.accessToken);
        tokenStorage.setRefreshToken(tokens.refreshToken);

        const resolvedUser = resolveUserFromToken(tokens.accessToken);
        setAccessToken(tokens.accessToken);
        setUser(resolvedUser);
      } finally {
        setIsLoading(false);
      }
    },
    [resolveUserFromToken]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Backend logout encountered error, clearing client session anyway:', e);
    } finally {
      tokenStorage.clearTokens();
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
