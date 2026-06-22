import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GuardianAccessService } from '../../common/guardian/guardian-access.service';
import type {
  ChildSummary,
  DaySummaryView,
  DaySubjectView,
  BehaviourRatingView,
  ProgressView,
  ProgressSubject,
  ProgressBadge,
  SessionUser,
} from '@schoolbridge/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isoDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function behaviourLevelToNumber(level: string): number {
  if (level === 'EXCELLENT') return 5;
  if (level === 'GOOD') return 3.5;
  return 2; // NEEDS_WORK
}

/** Return the ISO week string "YYYY-Www" for a given date. */
function isoWeek(d: Date): string {
  // Copy date so we don't mutate; set to nearest Thursday
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardian: GuardianAccessService,
  ) {}

  // ── 1. GET me/pupils ────────────────────────────────────────────────────────

  async myPupils(schoolId: string, userId: string): Promise<ChildSummary[]> {
    const guardedIds = await this.guardian.guardedPupilIds(schoolId, userId);
    if (guardedIds.length === 0) return [];

    // Fetch pupils with their active enrollment
    const pupils = await this.prisma.pupil.findMany({
      where: { id: { in: guardedIds }, schoolId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        admissionNo: true,
        enrollments: {
          where: { leftAt: null },
          take: 1,
          select: {
            classRoom: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Unread message receipt counts — groupBy pupilId
    const unreadGroups = await this.prisma.messageReceipt.groupBy({
      by: ['pupilId'],
      where: {
        pupilId: { in: guardedIds },
        readAt: null,
        message: { deletedAt: null },
      },
      _count: { _all: true },
    });

    const unreadMap = new Map<string, number>(
      unreadGroups.map((g) => [g.pupilId, g._count._all]),
    );

    return pupils.map((p) => {
      const activeEnrollment = p.enrollments[0] ?? null;
      return {
        id: p.id,
        fullName: p.fullName,
        admissionNo: p.admissionNo,
        className: activeEnrollment?.classRoom.name ?? null,
        classId: activeEnrollment?.classRoom.id ?? null,
        unreadCount: unreadMap.get(p.id) ?? 0,
      };
    });
  }

  // ── 2. GET :pupilId/day-summary ─────────────────────────────────────────────

  async daySummary(
    user: SessionUser,
    schoolId: string,
    pupilId: string,
    dateParam: string | undefined,
  ): Promise<DaySummaryView> {
    if (!this.guardian.isElevated(user, schoolId)) {
      await this.guardian.assertGuardianOf(schoolId, user.id, pupilId);
    }

    // Normalise date to UTC midnight (date-only)
    const rawDate = dateParam ? new Date(dateParam) : new Date();
    const date = toDateOnly(rawDate);

    // Fetch all three in parallel
    const [attendance, subjectNotes, behaviourRatings] = await Promise.all([
      this.prisma.attendance.findUnique({
        where: { pupilId_date: { pupilId, date } },
        select: { status: true, arrivedAt: true, mood: true },
      }),
      this.prisma.daySubjectNote.findMany({
        where: { pupilId, date, schoolId },
        include: { subject: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.behaviourRating.findMany({
        where: { pupilId, date, schoolId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const subjects: DaySubjectView[] = subjectNotes.map((n) => ({
      subjectId: n.subjectId,
      subject: n.subject.name,
      topic: n.topic,
      note: n.note,
      score: n.score,
      maxScore: n.maxScore,
    }));

    const ratings: BehaviourRatingView[] = behaviourRatings.map((r) => ({
      label: r.label,
      value: r.value,
    }));

    return {
      date: isoDateString(date),
      attendance: {
        status: attendance?.status ?? null,
        arrivedAt: attendance?.arrivedAt?.toISOString() ?? null,
        mood: attendance?.mood ?? null,
      },
      subjects,
      ratings,
    };
  }

  // ── 3. GET :pupilId/progress ─────────────────────────────────────────────────

  async progress(
    user: SessionUser,
    schoolId: string,
    pupilId: string,
    termId: string | undefined,
  ): Promise<ProgressView> {
    if (!this.guardian.isElevated(user, schoolId)) {
      await this.guardian.assertGuardianOf(schoolId, user.id, pupilId);
    }

    // Resolve term
    let resolvedTermId: string | null = termId ?? null;
    if (!resolvedTermId) {
      const currentTerm = await this.prisma.term.findFirst({
        where: { schoolId, isCurrent: true },
        select: { id: true },
      });
      resolvedTermId = currentTerm?.id ?? null;
    }

    // Fetch assessment results for this pupil
    const results = await (resolvedTermId
      ? this.prisma.assessmentResult.findMany({
          where: { schoolId, pupilId, termId: resolvedTermId },
          include: { subject: { select: { name: true } } },
        })
      : Promise.resolve([]));

    // Per-subject pct and term average
    const subjects: ProgressSubject[] = results.map((r) => ({
      subject: r.subject.name,
      pct: r.maxScore.toNumber() === 0
        ? 0
        : Math.round((r.score.toNumber() / r.maxScore.toNumber()) * 100),
    }));

    const termAvg =
      subjects.length === 0
        ? 0
        : Math.round(subjects.reduce((s, x) => s + x.pct, 0) / subjects.length);

    const grade = termAvg >= 80
      ? 'A — Excellent'
      : termAvg >= 70
      ? 'B — Very Good'
      : termAvg >= 60
      ? 'C — Good'
      : termAvg >= 50
      ? 'D — Fair'
      : 'E — Needs work';

    // ── Position ─────────────────────────────────────────────────────────────
    let position: string | null = null;

    const activeEnrollment = await this.prisma.enrollment.findFirst({
      where: { pupilId, leftAt: null },
      select: { classRoomId: true },
    });

    if (activeEnrollment && resolvedTermId) {
      const classEnrollments = await this.prisma.enrollment.findMany({
        where: { classRoomId: activeEnrollment.classRoomId, leftAt: null },
        select: { pupilId: true },
      });
      const classPupilIds = classEnrollments.map((e) => e.pupilId);

      if (classPupilIds.length > 0) {
        // Fetch all assessment results for the class in this term
        const classResults = await this.prisma.assessmentResult.findMany({
          where: {
            schoolId,
            termId: resolvedTermId,
            pupilId: { in: classPupilIds },
          },
          select: { pupilId: true, score: true, maxScore: true },
        });

        // Group by pupilId and compute average pct in JS
        const pupilPcts = new Map<string, { sum: number; count: number }>();
        for (const r of classResults) {
          const pct =
            r.maxScore.toNumber() === 0
              ? 0
              : (r.score.toNumber() / r.maxScore.toNumber()) * 100;
          const existing = pupilPcts.get(r.pupilId) ?? { sum: 0, count: 0 };
          pupilPcts.set(r.pupilId, { sum: existing.sum + pct, count: existing.count + 1 });
        }

        // Convert to average per pupil
        const avgPcts: Array<{ pupilId: string; avg: number }> = [];
        for (const [pid, { sum, count }] of pupilPcts) {
          avgPcts.push({ pupilId: pid, avg: count === 0 ? 0 : Math.round(sum / count) });
        }

        // Sort descending
        avgPcts.sort((a, b) => b.avg - a.avg);

        const rank = avgPcts.findIndex((x) => x.pupilId === pupilId) + 1;
        if (rank > 0) {
          position = `${ordinal(rank)} of ${classPupilIds.length}`;
        }
      }
    }

    // ── Attendance summary ────────────────────────────────────────────────────
    const attendanceGrouped = resolvedTermId
      ? await this.prisma.attendance.groupBy({
          by: ['status'],
          where: { schoolId, pupilId, termId: resolvedTermId },
          _count: { _all: true },
        })
      : [];

    const attCounts: Record<string, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };
    for (const row of attendanceGrouped) {
      attCounts[row.status] = row._count._all;
    }
    const present = attCounts['PRESENT'] ?? 0;
    const late = attCounts['LATE'] ?? 0;
    const total = present + late + (attCounts['ABSENT'] ?? 0) + (attCounts['EXCUSED'] ?? 0);
    const presentRate = total === 0 ? 0 : Math.round(((present + late) / total) * 100);
    const attendanceDays = `${present + late} / ${total} days`;

    // ── Behaviour weeks (last 6 ISO weeks) ───────────────────────────────────
    const behaviourRatings = await this.prisma.behaviourRating.findMany({
      where: { schoolId, pupilId },
      select: { date: true, value: true },
      orderBy: { date: 'desc' },
      take: 500, // bounded fetch; we process in JS
    });

    // Group by ISO week, average numeric value per week
    const weekMap = new Map<string, { sum: number; count: number }>();
    for (const r of behaviourRatings) {
      const week = isoWeek(r.date);
      const existing = weekMap.get(week) ?? { sum: 0, count: 0 };
      weekMap.set(week, {
        sum: existing.sum + behaviourLevelToNumber(r.value),
        count: existing.count + 1,
      });
    }

    // Sort weeks ascending, take last 6
    const sortedWeeks = [...weekMap.keys()].sort();
    const lastSixWeeks = sortedWeeks.slice(-6);
    const behaviourWeeks: number[] = lastSixWeeks.map((w) => {
      const entry = weekMap.get(w)!;
      return Math.round((entry.sum / entry.count) * 10) / 10;
    });

    // ── Badges ────────────────────────────────────────────────────────────────
    const badgeRows = await this.prisma.pupilBadge.findMany({
      where: { pupilId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { icon: true, label: true, sub: true },
    });

    const badges: ProgressBadge[] = badgeRows.map((b) => ({
      icon: b.icon,
      label: b.label,
      sub: b.sub,
    }));

    return {
      termId: resolvedTermId,
      termAvg,
      grade,
      position,
      attendance: presentRate,
      attendanceDays,
      subjects,
      behaviourWeeks,
      badges,
    };
  }
}
