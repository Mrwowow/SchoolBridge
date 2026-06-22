/**
 * src/api/auth.ts
 * Auth API calls — these don't go through the generic request() helper
 * because they are called before a token is available.
 */
import {
  type AuthTokens,
  type LoginDto,
  type RequestOtpDto,
  type SessionUser,
  type VerifyOtpDto,
} from '@schoolbridge/types';
import { api } from './client';

/** The API returns AuthTokens from login/verify; the user is fetched separately. */
export type LoginResponse = AuthTokens;

export const authApi = {
  /** Phone + password login → tokens */
  login: (dto: LoginDto): Promise<AuthTokens> =>
    api.post<AuthTokens>('/auth/login', dto),

  /** Request a 6-digit OTP via SMS */
  requestOtp: (dto: RequestOtpDto): Promise<{ message: string }> =>
    api.post('/auth/request-otp', dto),

  /** Verify OTP → tokens */
  verifyOtp: (dto: VerifyOtpDto): Promise<AuthTokens> =>
    api.post<AuthTokens>('/auth/verify-otp', dto),

  /** Refresh access token using refresh token */
  refresh: (refreshToken: string): Promise<AuthTokens> =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }),

  /** Get current session user */
  me: (): Promise<SessionUser> => api.get<SessionUser>('/auth/me'),
};
