/**
 * Centralized Server & WebSocket URL Resolver
 * Supports seamless multi-device cross-domain connectivity between Vercel deployments
 * and the Google Cloud Run multiplayer backend server.
 */

export const DEFAULT_CLOUD_BACKEND_URL =
  'https://ais-pre-ohvu3ldljbu2zszu353vkc-311469337722.asia-southeast1.run.app';

const LOCAL_STORAGE_CUSTOM_BACKEND_KEY = 'cyber_pursuit_custom_backend_url';

export function isLocalOrNativeRunApp(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.run.app')
  );
}

export function getCustomServerUrl(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_BACKEND_KEY);
      if (saved && saved.trim().startsWith('http')) {
        return saved.trim().replace(/\/+$/, '');
      }
    }
  } catch {}
  return null;
}

export function setCustomServerUrl(url: string | null): void {
  try {
    if (typeof localStorage !== 'undefined') {
      if (!url || !url.trim()) {
        localStorage.removeItem(LOCAL_STORAGE_CUSTOM_BACKEND_KEY);
      } else {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_BACKEND_KEY, url.trim().replace(/\/+$/, ''));
      }
    }
  } catch {}
}

/**
 * Returns the effective base URL for API & WebSocket calls.
 * If running on Vercel or an external domain without an Express server,
 * automatically routes traffic to the Cloud Run backend so registration,
 * profiles, and multiplayer operate seamlessly across devices.
 */
export function getServerBaseUrl(): string {
  // 1. User manual override from Settings
  const custom = getCustomServerUrl();
  if (custom) return custom;

  // 2. Vite environment variable (configured in Vercel or .env)
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_SERVER_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Current origin (works for localhost, Cloud Run, custom domain proxy, etc.)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return DEFAULT_CLOUD_BACKEND_URL;
}

/**
 * Resolves a full API URL given a path like '/api/auth/register'
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getServerBaseUrl();
  // If base matches current origin, we can use cleanPath or full URL
  if (typeof window !== 'undefined' && base === window.location.origin) {
    return cleanPath;
  }
  return `${base}${cleanPath}`;
}
