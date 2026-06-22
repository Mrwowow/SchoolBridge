import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        locale: true,
        phoneVerifiedAt: true,
        createdAt: true,
        memberships: {
          select: { schoolId: true, role: true, joinedAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Look up an existing user by phone — used by admins to add a known person
   * to their school by phone instead of pasting an internal ID.
   * Returns minimal public fields plus whether they already belong to the
   * given school (so the UI can avoid duplicate-add attempts).
   */
  async lookupByPhone(phone: string, schoolId: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        phone: true,
        memberships: {
          where: { schoolId },
          select: { role: true },
        },
      },
    });
    if (!user) throw new NotFoundException('No account found for that phone number');

    const { memberships, ...rest } = user;
    return {
      ...rest,
      alreadyMember: memberships.length > 0,
      existingRoles: memberships.map((m) => m.role),
    };
  }

  async listBySchool(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        memberships: { some: { schoolId } },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        locale: true,
        memberships: {
          where: { schoolId },
          select: { role: true, joinedAt: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }
}
