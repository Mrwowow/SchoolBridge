import { z } from 'zod';
import { BehaviourLevel } from './enums';

const id = () => z.string().min(1);

// ── Children list (GET /parents/me/pupils) ──────────────────────────────────

/** A pupil the authenticated parent guards, with display + badge metadata. */
export interface ChildSummary {
  id: string;
  fullName: string;
  admissionNo: string | null;
  /** Active class name, or null if not enrolled. */
  className: string | null;
  classId: string | null;
  /** Unread booklet messages for this pupil (for a badge). */
  unreadCount: number;
}

// ── Day summary (GET /schools/:schoolId/pupils/:pupilId/day-summary) ─────────

export interface DaySubjectView {
  subjectId: string;
  subject: string;
  topic: string;
  note: string | null;
  /** Rendered as "8/10" on the client when present. */
  score: number | null;
  maxScore: number | null;
}

export interface BehaviourRatingView {
  label: string;
  value: BehaviourLevel;
}

export interface DaySummaryView {
  date: string;
  attendance: {
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
    arrivedAt: string | null;
    mood: string | null;
  };
  subjects: DaySubjectView[];
  ratings: BehaviourRatingView[];
}

// ── Progress / report card (GET /schools/:schoolId/pupils/:pupilId/progress) ─

export interface ProgressSubject {
  subject: string;
  pct: number;
}

export interface ProgressBadge {
  icon: string;
  label: string;
  sub: string | null;
}

export interface ProgressView {
  termId: string | null;
  termAvg: number;
  grade: string;
  /** e.g. "6th of 28" — null when class rank can't be computed. */
  position: string | null;
  attendance: number;
  attendanceDays: string;
  subjects: ProgressSubject[];
  /** Average behaviour score (0–5) per recent week, oldest → newest. */
  behaviourWeeks: number[];
  badges: ProgressBadge[];
}

// ── Teacher write DTOs (day notes, behaviour, badges, homework submit) ──────

export const UpsertDaySubjectNoteDto = z.object({
  pupilId: id(),
  subjectId: id(),
  date: z.coerce.date(),
  topic: z.string().min(1).max(200),
  note: z.string().max(500).optional(),
  score: z.number().int().min(0).max(1000).optional(),
  maxScore: z.number().int().min(1).max(1000).optional(),
});
export type UpsertDaySubjectNoteDto = z.infer<typeof UpsertDaySubjectNoteDto>;

export const UpsertBehaviourRatingDto = z.object({
  pupilId: id(),
  date: z.coerce.date(),
  ratings: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: BehaviourLevel,
      }),
    )
    .min(1)
    .max(20),
});
export type UpsertBehaviourRatingDto = z.infer<typeof UpsertBehaviourRatingDto>;

// ── Badge creation (teacher awards a milestone badge to a pupil) ─────────────

export const CreatePupilBadgeDto = z.object({
  icon: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  sub: z.string().max(80).optional(),
});
export type CreatePupilBadgeDto = z.infer<typeof CreatePupilBadgeDto>;

// ── Homework submission (parent marks a HOMEWORK message done) ───────────────

export const SubmitHomeworkDto = z.object({
  pupilId: id(),
});
export type SubmitHomeworkDto = z.infer<typeof SubmitHomeworkDto>;

// ── Teacher inbox (GET /schools/:schoolId/messages/inbox) ───────────────────

export interface InboxThreadView {
  /** The pupil this conversation is about. */
  pupilId: string;
  pupilName: string;
  /** The most recent guardian/teacher reply preview. */
  lastMessage: string;
  lastAt: string;
  unread: number;
  /** A guardian display name when resolvable. */
  parentName: string | null;
}

// ── Class homework status (GET .../messages/homework-status) ────────────────

export interface HomeworkStatusView {
  messageId: string;
  title: string;
  dueAt: string | null;
  submitted: number;
  total: number;
}

// ── Class daily status (GET .../classes/:id/report-status?date=) ────────────
// Per-pupil attendance + whether a daily report (day-note or behaviour) exists
// for the date — drives the teacher roster's present/sent indicators.

export interface ClassPupilStatusView {
  pupilId: string;
  fullName: string;
  admissionNo: string | null;
  attendance: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
  mood: string | null;
  reportSent: boolean;
}

export interface ClassReportStatusView {
  classId: string;
  date: string;
  present: number;
  absent: number;
  reportsSent: number;
  total: number;
  pupils: ClassPupilStatusView[];
}
