import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreatePupilDto,
  UpdatePupilDto,
  LinkGuardianDto,
  EnrollPupilDto,
  PaginationQuery,
  Paginated,
  UpsertDaySubjectNoteDto,
  UpsertBehaviourRatingDto,
  CreatePupilBadgeDto,
} from '@schoolbridge/types';

/** Normalise a Date to UTC midnight for @db.Date columns and unique keys. */
function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const pupilSelect = {
  id: true,
  fullName: true,
  dateOfBirth: true,
  gender: true,
  admissionNo: true,
  createdAt: true,
} satisfies Prisma.PupilSelect;

@Injectable()
export class PupilsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(schoolId: string, dto: CreatePupilDto) {
    try {
      return await this.prisma.pupil.create({
        data: {
          schoolId,
          fullName: dto.fullName,
          dateOfBirth: dto.dateOfBirth ?? null,
          gender: dto.gender ?? null,
          admissionNo: dto.admissionNo ?? null,
        },
        select: pupilSelect,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A pupil with this admission number already exists');
      }
      throw e;
    }
  }

  async list(
    schoolId: string,
    query: PaginationQuery & { classId?: string },
  ): Promise<Paginated<Prisma.PupilGetPayload<{ select: typeof pupilSelect }>>> {
    const { cursor, limit, classId } = query;

    const pupils = await this.prisma.pupil.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(classId ? { enrollments: { some: { classRoomId: classId, leftAt: null } } } : {}),
      },
      orderBy: { fullName: 'asc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: pupilSelect,
    });

    const hasMore = pupils.length > limit;
    const items = hasMore ? pupils.slice(0, limit) : pupils;
    const lastItem = items.at(-1);

    return { items, nextCursor: hasMore && lastItem ? lastItem.id : null };
  }

  async findOne(schoolId: string, id: string) {
    const pupil = await this.prisma.pupil.findFirst({
      where: { id, schoolId, deletedAt: null },
      include: {
        guardianLinks: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
        enrollments: {
          where: { leftAt: null },
          include: { classRoom: { select: { id: true, name: true } } },
        },
      },
    });
    if (!pupil) throw new NotFoundException('Pupil not found');
    return pupil;
  }

  async update(schoolId: string, id: string, dto: UpdatePupilDto) {
    await this.ensureExists(schoolId, id);
    try {
      return await this.prisma.pupil.update({
        where: { id },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.dateOfBirth !== undefined ? { dateOfBirth: dto.dateOfBirth } : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
          ...(dto.admissionNo !== undefined ? { admissionNo: dto.admissionNo } : {}),
        },
        select: pupilSelect,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('A pupil with this admission number already exists');
      }
      throw e;
    }
  }

  async softDelete(schoolId: string, id: string) {
    await this.ensureExists(schoolId, id);
    return this.prisma.pupil.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  // ── Guardian links ──────────────────────────────────────────────────────────

  async linkGuardian(schoolId: string, pupilId: string, dto: LinkGuardianDto) {
    await this.ensureExists(schoolId, pupilId);

    const member = await this.prisma.membership.findFirst({
      where: { userId: dto.userId, schoolId },
    });
    if (!member) {
      throw new NotFoundException('Guardian must be a member of this school');
    }

    try {
      return await this.prisma.guardianLink.create({
        data: {
          pupilId,
          userId: dto.userId,
          relationship: dto.relationship ?? 'GUARDIAN',
          isPrimary: dto.isPrimary ?? false,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('This guardian is already linked to the pupil');
      }
      throw e;
    }
  }

  async unlinkGuardian(schoolId: string, pupilId: string, userId: string) {
    await this.ensureExists(schoolId, pupilId);
    const result = await this.prisma.guardianLink.deleteMany({
      where: { pupilId, userId },
    });
    if (result.count === 0) throw new NotFoundException('Guardian link not found');
    return { unlinked: result.count };
  }

  // ── Enrollment ──────────────────────────────────────────────────────────────

  async enroll(schoolId: string, pupilId: string, dto: EnrollPupilDto) {
    await this.ensureExists(schoolId, pupilId);

    const classRoom = await this.prisma.classRoom.findFirst({
      where: { id: dto.classRoomId, schoolId },
    });
    if (!classRoom) throw new NotFoundException('Class not found in this school');

    return this.prisma.enrollment.upsert({
      where: { pupilId_classRoomId: { pupilId, classRoomId: dto.classRoomId } },
      create: { pupilId, classRoomId: dto.classRoomId },
      update: { leftAt: null },
    });
  }

  async unenroll(schoolId: string, pupilId: string, classRoomId: string) {
    await this.ensureExists(schoolId, pupilId);
    const result = await this.prisma.enrollment.updateMany({
      where: { pupilId, classRoomId, leftAt: null },
      data: { leftAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Active enrollment not found');
    return { unenrolled: result.count };
  }

  // ── Day notes ───────────────────────────────────────────────────────────────

  async upsertDayNote(
    schoolId: string,
    pupilId: string,
    userId: string,
    dto: UpsertDaySubjectNoteDto,
  ) {
    await this.ensureExists(schoolId, pupilId);

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, schoolId },
      select: { id: true },
    });
    if (!subject) throw new NotFoundException('Subject not found in this school');

    const date = toDateOnly(dto.date);

    return this.prisma.daySubjectNote.upsert({
      where: { pupilId_subjectId_date: { pupilId, subjectId: dto.subjectId, date } },
      create: {
        schoolId,
        pupilId,
        subjectId: dto.subjectId,
        date,
        topic: dto.topic,
        note: dto.note ?? null,
        score: dto.score ?? null,
        maxScore: dto.maxScore ?? null,
        createdBy: userId,
      },
      update: {
        topic: dto.topic,
        note: dto.note ?? null,
        score: dto.score ?? null,
        maxScore: dto.maxScore ?? null,
        createdBy: userId,
      },
    });
  }

  // ── Behaviour ratings ────────────────────────────────────────────────────────

  async upsertBehaviour(
    schoolId: string,
    pupilId: string,
    userId: string,
    dto: UpsertBehaviourRatingDto,
  ) {
    await this.ensureExists(schoolId, pupilId);

    const date = toDateOnly(dto.date);

    await this.prisma.$transaction(
      dto.ratings.map((r) =>
        this.prisma.behaviourRating.upsert({
          where: { pupilId_date_label: { pupilId, date, label: r.label } },
          create: {
            schoolId,
            pupilId,
            date,
            label: r.label,
            value: r.value,
            createdBy: userId,
          },
          update: {
            value: r.value,
            createdBy: userId,
          },
        }),
      ),
    );

    return { count: dto.ratings.length, date };
  }

  // ── Badges ──────────────────────────────────────────────────────────────────

  async upsertBadge(schoolId: string, pupilId: string, dto: CreatePupilBadgeDto) {
    await this.ensureExists(schoolId, pupilId);

    return this.prisma.pupilBadge.create({
      data: {
        schoolId,
        pupilId,
        icon: dto.icon,
        label: dto.label,
        sub: dto.sub ?? null,
      },
    });
  }

  async listBadges(schoolId: string, pupilId: string) {
    await this.ensureExists(schoolId, pupilId);

    return this.prisma.pupilBadge.findMany({
      where: { pupilId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── helpers ─────────────────────────────────────────────────────────────────

  private async ensureExists(schoolId: string, id: string) {
    const pupil = await this.prisma.pupil.findFirst({
      where: { id, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!pupil) throw new NotFoundException('Pupil not found');
  }
}
