import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSubjectDto, UpdateSubjectDto } from '@schoolbridge/types';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateSubjectDto) {
    try {
      return await this.prisma.subject.create({
        data: { schoolId, name: dto.name },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Subject '${dto.name}' already exists`);
      }
      throw e;
    }
  }

  async list(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto) {
    await this.ensureExists(schoolId, id);
    try {
      return await this.prisma.subject.update({
        where: { id },
        data: { ...(dto.name !== undefined ? { name: dto.name } : {}) },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Subject '${dto.name}' already exists`);
      }
      throw e;
    }
  }

  async remove(schoolId: string, id: string) {
    await this.ensureExists(schoolId, id);
    await this.prisma.subject.delete({ where: { id } });
    return { id };
  }

  private async ensureExists(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');
  }
}
