import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SessionUser } from '@schoolbridge/types';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * TenantGuard resolves the current school from the `x-school-id` request
 * header, verifies the school exists and is active, and confirms the
 * authenticated user has a membership in that school.
 *
 * It attaches `req.school` for downstream use.
 * SUPER_ADMIN bypasses the membership check but the header is still required.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: SessionUser; school: { id: string; name: string } }>();

    const schoolId = request.headers['x-school-id'] as string | undefined;
    if (!schoolId) {
      throw new BadRequestException('x-school-id header is required');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, status: true },
    });

    if (!school) {
      throw new NotFoundException(`School not found: ${schoolId}`);
    }

    if (school.status !== 'ACTIVE') {
      throw new ForbiddenException(`School account is ${school.status.toLowerCase()}`);
    }

    const user = request.user;
    if (!user) throw new ForbiddenException('Unauthenticated');

    const isSuperAdmin = user.memberships.some((m) => m.role === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      const hasMembership = user.memberships.some((m) => m.schoolId === schoolId);
      if (!hasMembership) {
        throw new ForbiddenException('You are not a member of this school');
      }
    }

    request.school = { id: school.id, name: school.name };
    return true;
  }
}
