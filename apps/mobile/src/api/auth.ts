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

export interface LoginResponse {
  tokens: AuthTokens;
  user: SessionUser;
}

export const authApi = {
  /** Phone + password login */
  login: (dto: LoginDto): Promise<LoginResponse> =>
    api.post<LoginResponse>('/auth/login', dto),

  /** Request a 6-digit OTP via SMS */
  requestOtp: (dto: RequestOtpDto): Promise<{ message: string }> =>
    api.post('/auth/otp/request', dto),

  /** Verify OTP and get tokens */
  verifyOtp: (dto: VerifyOtpDto): Promise<LoginResponse> =>
    api.post<LoginResponse>('/auth/otp/verify', dto),

  /** Refresh access token using refresh token */
  refresh: (refreshToken: string): Promise<AuthTokens> =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }),

  /** Get current session user */
  me: (): Promise<SessionUser> => api.get<SessionUser>('/auth/me'),

  /** Revoke refresh token */
  logout: (): Promise<void> => api.post('/auth/logout'),
};
