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

export const BehaviourLevel = z.enum(['NEEDS_WORK', 'GOOD', 'EXCELLENT']);
export type BehaviourLevel = z.infer<typeof BehaviourLevel>;

export const NotificationChannel = z.enum(['PUSH', 'SMS', 'EMAIL', 'IN_APP']);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const SchoolPlan = z.enum(['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM']);
export type SchoolPlan = z.infer<typeof SchoolPlan>;

export const SchoolStatus = z.enum(['ACTIVE', 'SUSPENDED', 'CHURNED']);
export type SchoolStatus = z.infer<typeof SchoolStatus>;

/** A guardian's relationship to a pupil. */
export const GuardianRelationship = z.enum([
  'FATHER',
  'MOTHER',
  'GUARDIAN',
  'SIBLING',
  'OTHER',
]);
export type GuardianRelationship = z.infer<typeof GuardianRelationship>;
