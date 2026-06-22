import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Cross-tenant platform analytics for the Super Admin.
 * All figures span every school (tenant) on the platform.
 */
@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      schoolsByStatus,
      schoolsByPlan,
      totalSchools,
      totalPupils,
      totalUsers,
      totalMessages,
      recentSchools,
    ] = await Promise.all([
      this.prisma.school.groupBy({ by: ['status'], _count: true, orderBy: { status: 'asc' } }),
      this.prisma.school.groupBy({ by: ['plan'], _count: true, orderBy: { plan: 'asc' } }),
      this.prisma.school.count(),
      this.prisma.pupil.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.message.count({ where: { deletedAt: null } }),
      this.prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          createdAt: true,
          _count: { select: { pupils: true } },
        },
      }),
    ]);

    const byStatus = countMap(schoolsByStatus.map((r) => [r.status, r._count]));
    const byPlan = countMap(schoolsByPlan.map((r) => [r.plan, r._count]));

    return {
      totals: {
        schools: totalSchools,
        activeSchools: byStatus.ACTIVE ?? 0,
        suspendedSchools: byStatus.SUSPENDED ?? 0,
        churnedSchools: byStatus.CHURNED ?? 0,
        pupils: totalPupils,
        users: totalUsers,
        messages: totalMessages,
      },
      schoolsByStatus: byStatus,
      schoolsByPlan: byPlan,
      recentSchools,
    };
  }
}

function countMap(pairs: [string, number][]): Record<string, number> {
  return Object.fromEntries(pairs);
}
