import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateSchoolInput {
  name: string;
  slug: string;
  plan?: 'TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM';
  settings?: Record<string, unknown>;
}

export interface UpdateSchoolInput {
  name?: string;
  plan?: 'TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM';
  status?: 'ACTIVE' | 'SUSPENDED' | 'CHURNED';
  settings?: Record<string, unknown>;
}

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSchoolInput) {
    const existing = await this.prisma.school.findUnique({ where: { slug: input.slug } });
    if (existing) throw new ConflictException(`Slug '${input.slug}' is already taken`);

    return this.prisma.school.create({
      data: {
        name: input.name,
        slug: input.slug,
        plan: input.plan ?? 'TRIAL',
        settings: (input.settings ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findAll() {
    return this.prisma.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memberships: true, pupils: true, messages: true },
        },
      },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async update(id: string, input: UpdateSchoolInput) {
    await this.findById(id);
    return this.prisma.school.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.plan ? { plan: input.plan } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.settings ? { settings: input.settings as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async listMembers(schoolId: string) {
    return this.prisma.membership.findMany({
      where: { schoolId },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async addMember(schoolId: string, userId: string, role: string) {
    await this.findById(schoolId);
    return this.prisma.membership.create({
      data: { schoolId, userId, role: role as never },
    });
  }

  async removeMember(schoolId: string, userId: string, role: string) {
    return this.prisma.membership.deleteMany({
      where: { schoolId, userId, role: role as never },
    });
  }
}
