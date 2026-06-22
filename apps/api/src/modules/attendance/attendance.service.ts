import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GuardianAccessService } from '../../common/guardian/guardian-access.service';
import type { BulkAttendanceDto, AttendanceQuery, SessionUser } from '@schoolbridge/types';

/** Normalise to a UTC midnight Date for the `@db.Date` column + unique key. */
function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardian: GuardianAccessService,
  ) {}

  // ── Bulk daily register ─────────────────────────────────────────────────────

  async bulkRecord(schoolId: string, recordedBy: string, dto: BulkAttendanceDto) {
    const [term, klass] = await Promise.all([
      this.prisma.term.findFirst({ where: { id: dto.termId, schoolId }, select: { id: true } }),
      this.prisma.classRoom.findFirst({
        where: { id: dto.classRoomId, schoolId },
        select: { id: true },
      }),
    ]);
    if (!term) throw new NotFoundException('Term not found in this school');
    if (!klass) throw new NotFoundException('Class not found in this school');

    // All entry pupils must be enrolled in the class. Scope to this school so a
    // cross-tenant classRoomId can't be used to smuggle in foreign enrollments.
    const enrolled = await this.prisma.enrollment.findMany({
      where: { classRoomId: dto.classRoomId, leftAt: null, pupil: { schoolId } },
      select: { pupilId: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.pupilId));
    const stray = dto.entries.filter((e) => !enrolledIds.has(e.pupilId));
    if (stray.length > 0) {
      throw new BadRequestException(
        `Some pupils are not enrolled in this class: ${stray.map((s) => s.pupilId).join(', ')}`,
      );
    }

    const date = toDateOnly(dto.date);

    await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.attendance.upsert({
          where: { pupilId_date: { pupilId: entry.pupilId, date } },
          create: {
            schoolId,
            termId: dto.termId,
            classRoomId: dto.classRoomId,
            pupilId: entry.pupilId,
            date,
            status: entry.status,
            note: entry.note ?? null,
            mood: entry.mood ?? null,
            arrivedAt: entry.arrivedAt ?? null,
            recordedBy,
          },
          update: {
            status: entry.status,
            note: entry.note ?? null,
            mood: entry.mood ?? null,
            arrivedAt: entry.arrivedAt ?? null,
            termId: dto.termId,
            classRoomId: dto.classRoomId,
            recordedBy,
          },
        }),
      ),
    );

    return { recorded: dto.entries.length, date };
  }

  // ── List / filter ────────────────────────────────────────────────────────────

  async list(user: SessionUser, schoolId: string, query: AttendanceQuery) {
    // Parents only see their own children's records; elevated roles see all.
    const pupilScope = await this.guardian.pupilFilter(user, schoolId, query.pupilId);
    const where: Prisma.AttendanceWhereInput = {
      schoolId,
      ...(query.classId ? { classRoomId: query.classId } : {}),
      ...pupilScope,
      ...(query.termId ? { termId: query.termId } : {}),
      ...(query.from || query.to
        ? {
            date: {
              ...(query.from ? { gte: toDateOnly(query.from) } : {}),
              ...(query.to ? { lte: toDateOnly(query.to) } : {}),
            },
          }
        : {}),
    };

    return this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { pupilId: 'asc' }],
      include: { pupil: { select: { id: true, fullName: true } } },
      take: 500,
    });
  }

  // ── Per-pupil summary for a term ──────────────────────────────────────────────

  async pupilSummary(user: SessionUser, schoolId: string, pupilId: string, termId: string) {
    const pupil = await this.prisma.pupil.findFirst({
      where: { id: pupilId, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!pupil) throw new NotFoundException('Pupil not found');

    // A parent may only view a pupil they guard.
    if (!this.guardian.isElevated(user, schoolId)) {
      await this.guardian.assertGuardianOf(schoolId, user.id, pupilId);
    }

    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { schoolId, pupilId, termId },
      _count: { _all: true },
    });

    const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const row of grouped) counts[row.status] = row._count._all;
    const total = counts.PRESENT + counts.ABSENT + counts.LATE + counts.EXCUSED;
    const presentRate = total === 0 ? 0 : Math.round(((counts.PRESENT + counts.LATE) / total) * 100);

    return { pupilId, termId, counts, total, presentRate };
  }
}
