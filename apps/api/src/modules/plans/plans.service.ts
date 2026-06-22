import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SchoolPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { UpdatePlanDto } from '@schoolbridge/types';

/**
 * Plan catalog management for the Super Admin. One row per SchoolPlan tier;
 * these define the price, limits and description behind each tier key.
 */
@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** All tiers, ordered cheapest → priciest for predictable display. */
  list() {
    return this.prisma.plan.findMany({ orderBy: { priceNaira: 'asc' } });
  }

  async findOne(tier: SchoolPlan) {
    const plan = await this.prisma.plan.findUnique({ where: { tier } });
    if (!plan) throw new NotFoundException(`Plan "${tier}" not found`);
    return plan;
  }

  async update(actorId: string, tier: SchoolPlan, dto: UpdatePlanDto) {
    // Ensure the tier exists before attempting the update.
    await this.findOne(tier);

    const updated = await this.prisma.plan.update({
      where: { tier },
      // `dto` only contains defined keys, so undefined fields are left untouched
      // while explicit `null`s (unlimited limits) are persisted.
      data: dto as Prisma.PlanUpdateInput,
    });

    await this.audit.log({
      // Plan catalog is platform-level (no tenant); audit it without a schoolId.
      userId: actorId,
      action: 'plan.update',
      resource: 'Plan',
      resourceId: tier,
      meta: dto as Record<string, unknown>,
    });

    return updated;
  }
}
