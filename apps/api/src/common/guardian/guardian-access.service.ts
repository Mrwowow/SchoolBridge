import { ForbiddenException, Injectable } from '@nestjs/common';
import type { SessionUser } from '@schoolbridge/types';
import { PrismaService } from '../../prisma/prisma.service';

/** Roles that may see every pupil's data within their school. */
const ELEVATED_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER'] as const;

/**
 * Resolves which pupils a PARENT user may see, based on their GuardianLink rows.
 *
 * Endpoints that expose pupil-scoped data (attendance, results, fees) are open
 * to PARENT, but a parent must only ever see their own children. Scoping by
 * schoolId alone is NOT enough — every parent shares a tenant with every other
 * family. These helpers add the guardian-link constraint.
 */
@Injectable()
export class GuardianAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** The pupil IDs this user is a guardian of, within the given school. */
  async guardedPupilIds(schoolId: string, userId: string): Promise<string[]> {
    const links = await this.prisma.guardianLink.findMany({
      where: { userId, pupil: { schoolId } },
      select: { pupilId: true },
    });
    return links.map((l) => l.pupilId);
  }

  /** True when the user is a guardian of the pupil in the given school. */
  async isGuardianOf(schoolId: string, userId: string, pupilId: string): Promise<boolean> {
    const link = await this.prisma.guardianLink.findFirst({
      where: { userId, pupilId, pupil: { schoolId } },
      select: { id: true },
    });
    return link !== null;
  }

  /**
   * Throws ForbiddenException unless the user guards the pupil. Use to guard a
   * single-pupil endpoint a parent reached.
   */
  async assertGuardianOf(schoolId: string, userId: string, pupilId: string): Promise<void> {
    if (!(await this.isGuardianOf(schoolId, userId, pupilId))) {
      throw new ForbiddenException('You are not a guardian of this pupil');
    }
  }

  /**
   * True when the user has an elevated (non-PARENT) role in the school, i.e.
   * may see all pupils. A SUPER_ADMIN is elevated in every school.
   */
  isElevated(user: SessionUser, schoolId: string): boolean {
    return user.memberships.some(
      (m) =>
        (m.schoolId === schoolId || m.role === 'SUPER_ADMIN') &&
        (ELEVATED_ROLES as readonly string[]).includes(m.role),
    );
  }

  /**
   * Resolves the `pupilId` Prisma filter for a list endpoint open to parents.
   *
   * - Elevated users: honour the optional `requestedPupilId` filter as-is.
   * - Parents: constrain to their guarded pupils, intersected with any
   *   `requestedPupilId` they passed. If a parent requests a pupil they don't
   *   guard (or guards none), this returns a filter matching nothing.
   */
  async pupilFilter(
    user: SessionUser,
    schoolId: string,
    requestedPupilId?: string,
  ): Promise<{ pupilId?: string | { in: string[] } }> {
    if (this.isElevated(user, schoolId)) {
      return requestedPupilId ? { pupilId: requestedPupilId } : {};
    }

    const guarded = await this.guardedPupilIds(schoolId, user.id);
    // Intersect the guarded set with any requested pupil. `in: []` matches
    // nothing in Prisma — the correct result for a parent who guards no pupils,
    // or who requested a pupil they don't guard.
    const allowed = requestedPupilId
      ? guarded.filter((id) => id === requestedPupilId)
      : guarded;
    return { pupilId: { in: allowed } };
  }
}
