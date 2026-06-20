import { z } from 'zod';
import { Role } from './enums';

/** Nigerian phone: accepts 0XXXXXXXXXX or +234XXXXXXXXXX. */
export const phoneSchema = z
  .string()
  .regex(/^(\+234|0)\d{10}$/, 'Enter a valid Nigerian phone number');

export const RegisterDto = z.object({
  fullName: z.string().min(2).max(120),
  phone: phoneSchema,
  email: z.string().email().optional(),
  password: z.string().min(8).max(128),
  locale: z.string().default('en'),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDto>;

export const RequestOtpDto = z.object({ phone: phoneSchema });
export type RequestOtpDto = z.infer<typeof RequestOtpDto>;

export const VerifyOtpDto = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
});
export type VerifyOtpDto = z.infer<typeof VerifyOtpDto>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  locale: string;
  memberships: { schoolId: string; role: Role }[];
}
