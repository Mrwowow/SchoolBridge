/**
 * src/api/client.ts
 * Thin fetch wrapper that injects:
 *  - Authorization: Bearer <accessToken>
 *  - x-school-id: <schoolId>
 *  - Content-Type: application/json
 *
 * Throws ApiError (with .status) for non-2xx responses so React Query
 * can categorise retries vs hard errors.
 */
import Constants from 'expo-constants';
import { getAuthState, useAuthStore } from '../store/authStore';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env['EXPO_PUBLIC_API_URL'] ??
  'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the request never reached the server (network failure). */
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The request couldn't reach the API at all (offline, wrong host, server down). */
  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Override the school id for this single request (rarely needed) */
  schoolId?: string;
  /** Internal: skip the 401→refresh retry (used by the refresh call itself). */
  _skipAuthRefresh?: boolean;
};

/**
 * Single-flight access-token refresh. Concurrent 401s share one refresh call so
 * we don't fire N parallel /auth/refresh requests (which would rotate the
 * refresh token N times and invalidate it). Resolves to the new access token,
 * or null if refresh failed (caller should surface the original 401).
 */
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { refreshToken } = getAuthState();
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const tokens = (await res.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      await useAuthStore.getState().setTokens(tokens);
      return tokens.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(
  path: string,
  { body, schoolId, headers: extraHeaders, _skipAuthRefresh, ...init }: RequestOptions = {},
): Promise<T> {
  const { accessToken, schoolId: storedSchoolId } = getAuthState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const resolvedSchoolId = schoolId ?? storedSchoolId;
  if (resolvedSchoolId) {
    headers['x-school-id'] = resolvedSchoolId;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch rejects (TypeError) when the request never reaches the server:
    // device offline, wrong EXPO_PUBLIC_API_URL host, or API not running.
    throw new ApiError(
      0,
      `Can't reach the server. Check your connection and try again.`,
    );
  }

  // Access token expired → refresh once and retry the original request.
  if (response.status === 401 && !_skipAuthRefresh && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, {
        body,
        schoolId,
        headers: extraHeaders,
        _skipAuthRefresh: true,
        ...init,
      });
    }
    // Refresh failed → session is dead; sign out so the AuthGate redirects.
    await useAuthStore.getState().logout();
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    const message =
      typeof errorBody === 'object' &&
      errorBody !== null &&
      'message' in errorBody
        ? String((errorBody as { message: unknown }).message)
        : `HTTP ${response.status}`;

    throw new ApiError(response.status, message, errorBody);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PUT', body }),

  delete: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};
