import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateClassDto,
  UpdateClassDto,
  ClassReportStatusView,
} from '@schoolbridge/types';

/** Normalise to UTC midnight to match the @db.Date columns. */
function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateClassDto) {
    if (dto.classTeacherId) await this.assertClassTeacher(schoolId, dto.classTeacherId);
    try {
      return await this.prisma.classRoom.create({
        data: {
          schoolId,
          name: dto.name,
          classTeacherId: dto.classTeacherId ?? null,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`A class named '${dto.name}' already exists`);
      }
      throw e;
    }
  }

  async list(schoolId: string) {
    return this.prisma.classRoom.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { enrollments: { where: { leftAt: null } } } },
      },
    });
  }

  async findOne(schoolId: string, id: string) {
    const klass = await this.prisma.classRoom.findFirst({
      where: { id, schoolId },
      include: {
        enrollments: {
          where: { leftAt: null },
          include: { pupil: { select: { id: true, fullName: true, admissionNo: true } } },
        },
      },
    });
    if (!klass) throw new NotFoundException('Class not found');
    return klass;
  }

  async update(schoolId: string, id: string, dto: UpdateClassDto) {
    await this.ensureExists(schoolId, id);
    if (dto.classTeacherId) await this.assertClassTeacher(schoolId, dto.classTeacherId);
    try {
      return await this.prisma.classRoom.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.classTeacherId !== undefined ? { classTeacherId: dto.classTeacherId } : {}),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`A class named '${dto.name}' already exists`);
      }
      throw e;
    }
  }

  async remove(schoolId: string, id: string) {
    await this.ensureExists(schoolId, id);
    const active = await this.prisma.enrollment.count({
      where: { classRoomId: id, leftAt: null },
    });
    if (active > 0) {
      throw new BadRequestException('Cannot delete a class with active enrollments');
    }
    await this.prisma.classRoom.delete({ where: { id } });
    return { id };
  }

  /**
   * Per-pupil daily status for a class on a date: attendance + whether a daily
   * report (a day-note or behaviour rating) has been recorded. Drives the
   * teacher roster's present/absent and "report sent" indicators.
   */
  async reportStatus(
    schoolId: string,
    classId: string,
    date?: Date,
  ): Promise<ClassReportStatusView> {
    await this.ensureExists(schoolId, classId);
    const day = toDateOnly(date ?? new Date());

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classRoomId: classId, leftAt: null, pupil: { schoolId } },
      select: { pupil: { select: { id: true, fullName: true, admissionNo: true } } },
    });
    const pupilIds = enrollments.map((e) => e.pupil.id);

    const [attendance, dayNotes, ratings] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { pupilId: { in: pupilIds }, date: day },
        select: { pupilId: true, status: true, mood: true },
      }),
      this.prisma.daySubjectNote.findMany({
        where: { pupilId: { in: pupilIds }, date: day },
        select: { pupilId: true },
        distinct: ['pupilId'],
      }),
      this.prisma.behaviourRating.findMany({
        where: { pupilId: { in: pupilIds }, date: day },
        select: { pupilId: true },
        distinct: ['pupilId'],
      }),
    ]);

    const attMap = new Map(attendance.map((a) => [a.pupilId, a]));
    const reported = new Set([
      ...dayNotes.map((d) => d.pupilId),
      ...ratings.map((r) => r.pupilId),
    ]);

    const pupils = enrollments.map((e) => {
      const att = attMap.get(e.pupil.id);
      return {
        pupilId: e.pupil.id,
        fullName: e.pupil.fullName,
        admissionNo: e.pupil.admissionNo,
        attendance: att?.status ?? null,
        mood: att?.mood ?? null,
        reportSent: reported.has(e.pupil.id),
      };
    });

    return {
      classId,
      date: day.toISOString().slice(0, 10),
      present: pupils.filter((p) => p.attendance === 'PRESENT' || p.attendance === 'LATE').length,
      absent: pupils.filter((p) => p.attendance === 'ABSENT').length,
      reportsSent: pupils.filter((p) => p.reportSent).length,
      total: pupils.length,
      pupils,
    };
  }

  // ── helpers ─────────────────────────────────────────────────────────────────

  private async ensureExists(schoolId: string, id: string) {
    const klass = await this.prisma.classRoom.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });
    if (!klass) throw new NotFoundException('Class not found');
  }

  private async assertClassTeacher(schoolId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        id: membershipId,
        schoolId,
        role: { in: ['CLASS_TEACHER', 'TEACHER'] },
      },
    });
    if (!membership) {
      throw new BadRequestException('classTeacherId must be a teacher membership in this school');
    }
  }
}
