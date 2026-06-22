import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  schoolId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Writes immutable audit-trail rows. Logging is best-effort: a failure to
 * persist an audit row must never break the user-facing operation, so errors
 * are logged and swallowed.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          schoolId: entry.schoolId ?? null,
          userId: entry.userId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          meta: (entry.meta ?? {}) as Prisma.InputJsonValue,
          ip: entry.ip ?? null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write audit log (${entry.action}): ${(err as Error).message}`);
    }
  }

  async listForSchool(schoolId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { id: true, fullName: true } } },
    });
  }
}
