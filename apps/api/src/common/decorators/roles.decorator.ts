import { SetMetadata } from '@nestjs/common';
import type { Role } from '@schoolbridge/types';

export const ROLES_KEY = 'roles';

/**
 * Attach required roles to a route handler.
 *
 * Usage:
 *   @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
