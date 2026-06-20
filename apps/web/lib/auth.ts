/**
 * Auth token and school-scope storage helpers.
 * Uses localStorage on the client; falls back gracefully in SSR.
 */

const TOKEN_KEY = 'sb_access_token';
const REFRESH_KEY = 'sb_refresh_token';
const SCHOOL_KEY = 'sb_school_id';

function isBrowser() {
  return typeof window !== 'undefined';
}

// ── Token helpers ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(REFRESH_KEY, token);
}

// ── School scope helpers ───────────────────────────────────────────────────

export function getSchoolId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(SCHOOL_KEY);
}

export function setSchoolId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(SCHOOL_KEY, id);
}

// ── Session lifecycle ──────────────────────────────────────────────────────

export function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(SCHOOL_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
