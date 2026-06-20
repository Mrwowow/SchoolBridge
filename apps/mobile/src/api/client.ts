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
import { getAuthState } from '../store/authStore';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env['EXPO_PUBLIC_API_URL'] ??
  'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Override the school id for this single request (rarely needed) */
  schoolId?: string;
};

async function request<T>(
  path: string,
  { body, schoolId, headers: extraHeaders, ...init }: RequestOptions = {},
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

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

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
