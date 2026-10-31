import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Parses JWT payload for client-side UI display only.
 * IMPORTANT: Never treat this decoded payload as cryptographic proof of authorization.
 * Authorization is strictly enforced by the backend on every API request.
 */
export function decodeJwt<T>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired based on its exp claim.
 */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload || !payload.exp) return true;
  // Exp is in seconds; Date.now() in ms
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}
