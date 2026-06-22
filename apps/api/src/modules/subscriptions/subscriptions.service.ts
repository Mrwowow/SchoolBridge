import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { UpsertSubscriptionDto } from '@schoolbridge/types';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    return this.prisma.subscription.findMany({
      orderBy: { currentPeriodEnd: 'desc' },
      include: { school: { select: { id: true, name: true, slug: true, status: true } } },
    });
  }

  async forSchool(schoolId: string) {
    return this.prisma.subscription.findMany({
      where: { schoolId },
      orderBy: { currentPeriodEnd: 'desc' },
    });
  }

  /**
   * Create (or update the latest) subscription for a school and sync the
   * school's plan — School.plan is the source of truth for the active tier.
   */
  async upsert(actorId: string, dto: UpsertSubscriptionDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { id: true },
    });
    if (!school) throw new NotFoundException('School not found');

    const existing = await this.prisma.subscription.findFirst({
      where: { schoolId: dto.schoolId },
      orderBy: { currentPeriodEnd: 'desc' },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const sub = existing
        ? await tx.subscription.update({
            where: { id: existing.id },
            data: {
              plan: dto.plan,
              status: 'ACTIVE',
              currentPeriodStart: dto.currentPeriodStart,
              currentPeriodEnd: dto.currentPeriodEnd,
              paystackSubCode: dto.paystackSubCode ?? null,
            },
          })
        : await tx.subscription.create({
            data: {
              schoolId: dto.schoolId,
              plan: dto.plan,
              status: 'ACTIVE',
              currentPeriodStart: dto.currentPeriodStart,
              currentPeriodEnd: dto.currentPeriodEnd,
              paystackSubCode: dto.paystackSubCode ?? null,
            },
          });

      await tx.school.update({ where: { id: dto.schoolId }, data: { plan: dto.plan } });
      return sub;
    });

    await this.audit.log({
      schoolId: dto.schoolId,
      userId: actorId,
      action: existing ? 'subscription.update' : 'subscription.create',
      resource: 'Subscription',
      resourceId: result.id,
      meta: { plan: dto.plan },
    });

    return result;
  }

  async cancel(actorId: string, id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.audit.log({
      schoolId: sub.schoolId,
      userId: actorId,
      action: 'subscription.cancel',
      resource: 'Subscription',
      resourceId: id,
    });

    return updated;
  }
}
