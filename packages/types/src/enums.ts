import { z } from 'zod';

/** Roles a user can hold within a given school (tenant). */
export const Role = z.enum([
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'CLASS_TEACHER',
  'TEACHER',
  'PARENT',
]);
export type Role = z.infer<typeof Role>;

/** The kind of digital-booklet entry. */
export const MessageType = z.enum([
  'NOTE',
  'HOMEWORK',
  'BEHAVIOUR',
  'ATTENDANCE',
  'RESULT',
  'ANNOUNCEMENT',
  'FEE_REMINDER',
  'EVENT',
]);
export type MessageType = z.infer<typeof MessageType>;

/** Who a message is addressed to. */
export const MessageTarget = z.enum(['PUPIL', 'CLASS', 'SCHOOL']);
export type MessageTarget = z.infer<typeof MessageTarget>;

export const AttendanceStatus = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);
export type AttendanceStatus = z.infer<typeof AttendanceStatus>;

export const NotificationChannel = z.enum(['PUSH', 'SMS', 'EMAIL', 'IN_APP']);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const SchoolPlan = z.enum(['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM']);
export type SchoolPlan = z.infer<typeof SchoolPlan>;
