/**
 * FinSight Token Storage Service
 *
 * Architecture:
 * - Access Token: Stored primarily in-memory for security against persistent token exfiltration.
 * - Refresh Token: Stored in sessionStorage for MVP session persistence across page refreshes.
 * - Note: No cookie assumption, as backend does not issue Set-Cookie headers.
 */

const REFRESH_TOKEN_KEY = 'finsight_refresh_token';

let inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  setAccessToken(token: string | null): void {
    inMemoryAccessToken = token;
  },

  getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to set refresh token in sessionStorage', e);
    }
  },

  clearTokens(): void {
    inMemoryAccessToken = null;
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear sessionStorage tokens', e);
    }
  },
};
