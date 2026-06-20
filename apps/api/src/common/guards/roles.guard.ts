import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { SessionUser, Role } from '@schoolbridge/types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard checks that the authenticated user holds at least one of the
 * required roles for the current school (resolved from x-school-id header).
 *
 * If no @Roles() decorator is present the guard allows access.
 * SUPER_ADMIN bypasses all role checks.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user: SessionUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('No user on request');

    const schoolId = request.headers['x-school-id'] as string | undefined;

    // SUPER_ADMIN bypasses all role checks
    const isSuperAdmin = user.memberships.some((m) => m.role === 'SUPER_ADMIN');
    if (isSuperAdmin) return true;

    // Check roles within the requested school
    const userRolesInSchool = user.memberships
      .filter((m) => m.schoolId === schoolId)
      .map((m) => m.role);

    const hasRole = requiredRoles.some((r) => userRolesInSchool.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
