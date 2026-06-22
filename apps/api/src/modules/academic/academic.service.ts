import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAcademicYearDto, CreateTermDto } from '@schoolbridge/types';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Academic years ──────────────────────────────────────────────────────────

  async createYear(schoolId: string, dto: CreateAcademicYearDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isCurrent) {
          await tx.academicYear.updateMany({
            where: { schoolId, isCurrent: true },
            data: { isCurrent: false },
          });
        }
        return tx.academicYear.create({
          data: {
            schoolId,
            label: dto.label,
            startDate: dto.startDate,
            endDate: dto.endDate,
            isCurrent: dto.isCurrent ?? false,
          },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Academic year '${dto.label}' already exists`);
      }
      throw e;
    }
  }

  async listYears(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
      include: {
        terms: { orderBy: { startDate: 'asc' } },
      },
    });
  }

  // ── Terms ─────────────────────────────────────────────────────────────────

  async createTerm(schoolId: string, dto: CreateTermDto) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
      select: { id: true },
    });
    if (!year) throw new NotFoundException('Academic year not found in this school');

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isCurrent) {
          await tx.term.updateMany({
            where: { schoolId, isCurrent: true },
            data: { isCurrent: false },
          });
        }
        return tx.term.create({
          data: {
            schoolId,
            academicYearId: dto.academicYearId,
            label: dto.label,
            startDate: dto.startDate,
            endDate: dto.endDate,
            isCurrent: dto.isCurrent ?? false,
          },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Term '${dto.label}' already exists for this year`);
      }
      throw e;
    }
  }

  async setCurrentTerm(schoolId: string, termId: string) {
    const term = await this.prisma.term.findFirst({
      where: { id: termId, schoolId },
      select: { id: true },
    });
    if (!term) throw new NotFoundException('Term not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.term.updateMany({
        where: { schoolId, isCurrent: true },
        data: { isCurrent: false },
      });
      return tx.term.update({ where: { id: termId }, data: { isCurrent: true } });
    });
  }
}
