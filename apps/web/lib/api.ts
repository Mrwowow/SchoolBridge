/**
 * Typed fetch wrapper for the SchoolBridge REST API.
 * Automatically injects:
 *   - Authorization: Bearer <token>
 *   - x-school-id: <active school>
 *   - Content-Type: application/json
 *
 * Usage:
 *   const data = await apiFetch<Pupil[]>('/pupils');
 *   const msg  = await apiFetch<Message>('/messages', { method: 'POST', body: payload });
 */

import { getToken, getSchoolId } from './auth';

const BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Override the school scope for super-admin requests. */
  schoolId?: string;
  /** Skip auth header (e.g. login endpoint). */
  unauthenticated?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    schoolId,
    unauthenticated = false,
    headers: extraHeaders = {},
    ...rest
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  if (!unauthenticated) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const sid = schoolId ?? getSchoolId();
    if (sid) {
      headers['x-school-id'] = sid;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      // non-JSON error body — ignore
    }
    const message =
      typeof errorBody === 'object' &&
      errorBody !== null &&
      'message' in errorBody
        ? String((errorBody as { message: unknown }).message)
        : response.statusText;
    throw new ApiError(response.status, message, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
