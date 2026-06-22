import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GuardianAccessService } from '../../common/guardian/guardian-access.service';
import type { UpsertResultDto, ResultsQuery, SessionUser } from '@schoolbridge/types';

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardian: GuardianAccessService,
  ) {}

  async upsert(schoolId: string, dto: UpsertResultDto) {
    const [term, pupil, subject] = await Promise.all([
      this.prisma.term.findFirst({ where: { id: dto.termId, schoolId }, select: { id: true } }),
      this.prisma.pupil.findFirst({
        where: { id: dto.pupilId, schoolId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId },
        select: { id: true },
      }),
    ]);
    if (!term) throw new NotFoundException('Term not found in this school');
    if (!pupil) throw new NotFoundException('Pupil not found in this school');
    if (!subject) throw new NotFoundException('Subject not found in this school');

    const score = new Prisma.Decimal(dto.score);
    const maxScore = new Prisma.Decimal(dto.maxScore);

    return this.prisma.assessmentResult.upsert({
      where: {
        termId_pupilId_subjectId: {
          termId: dto.termId,
          pupilId: dto.pupilId,
          subjectId: dto.subjectId,
        },
      },
      create: {
        schoolId,
        termId: dto.termId,
        pupilId: dto.pupilId,
        subjectId: dto.subjectId,
        score,
        maxScore,
        grade: dto.grade ?? null,
        remarks: dto.remarks ?? null,
      },
      update: {
        score,
        maxScore,
        grade: dto.grade ?? null,
        remarks: dto.remarks ?? null,
      },
    });
  }

  async list(user: SessionUser, schoolId: string, query: ResultsQuery) {
    // Parents only see their own children's results; elevated roles see all.
    const pupilScope = await this.guardian.pupilFilter(user, schoolId, query.pupilId);
    return this.prisma.assessmentResult.findMany({
      where: {
        schoolId,
        ...pupilScope,
        ...(query.termId ? { termId: query.termId } : {}),
        ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true } },
        pupil: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Term result sheet for a single pupil — every subject score plus an
   * aggregate total/percentage/average.
   */
  async pupilTermSheet(user: SessionUser, schoolId: string, pupilId: string, termId: string) {
    const pupil = await this.prisma.pupil.findFirst({
      where: { id: pupilId, schoolId, deletedAt: null },
      select: { id: true, fullName: true, admissionNo: true },
    });
    if (!pupil) throw new NotFoundException('Pupil not found');

    // A parent may only view a pupil they guard.
    if (!this.guardian.isElevated(user, schoolId)) {
      await this.guardian.assertGuardianOf(schoolId, user.id, pupilId);
    }

    const results = await this.prisma.assessmentResult.findMany({
      where: { schoolId, pupilId, termId },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: { subject: { name: 'asc' } },
    });

    let totalScore = 0;
    let totalMax = 0;
    for (const r of results) {
      totalScore += r.score.toNumber();
      totalMax += r.maxScore.toNumber();
    }
    const percentage = totalMax === 0 ? 0 : Math.round((totalScore / totalMax) * 100);
    const average = results.length === 0 ? 0 : Math.round((totalScore / results.length) * 100) / 100;

    return {
      pupil,
      termId,
      subjects: results.map((r) => ({
        subjectId: r.subjectId,
        subject: r.subject.name,
        score: r.score.toNumber(),
        maxScore: r.maxScore.toNumber(),
        grade: r.grade,
        remarks: r.remarks,
      })),
      summary: { totalScore, totalMax, percentage, average, subjectCount: results.length },
    };
  }
}
