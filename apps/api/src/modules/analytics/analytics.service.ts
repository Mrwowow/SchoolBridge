import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Per-school engagement analytics for the admin dashboard.
 * Covers message delivery/acknowledgement, attendance mix, and parent reach.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async forSchool(schoolId: string) {
    const [
      pupils,
      activeClasses,
      messageTotals,
      receiptAgg,
      attendanceGroups,
      linkedGuardians,
      messagesByType,
    ] = await Promise.all([
      this.prisma.pupil.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.classRoom.count({ where: { schoolId } }),
      this.prisma.message.count({ where: { schoolId, deletedAt: null } }),
      this.prisma.messageReceipt.aggregate({
        where: { message: { schoolId, deletedAt: null } },
        _count: { _all: true },
      }),
      this.prisma.attendance.groupBy({
        by: ['status'],
        where: { schoolId },
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.guardianLink.findMany({
        where: { pupil: { schoolId, deletedAt: null } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.message.groupBy({
        by: ['type'],
        where: { schoolId, deletedAt: null },
        _count: true,
        orderBy: { type: 'asc' },
      }),
    ]);

    // Read / acknowledge rates over all receipts.
    const totalReceipts = receiptAgg._count._all;
    const [readCount, ackCount] = await Promise.all([
      this.prisma.messageReceipt.count({
        where: { message: { schoolId, deletedAt: null }, readAt: { not: null } },
      }),
      this.prisma.messageReceipt.count({
        where: { message: { schoolId, deletedAt: null }, acknowledgedAt: { not: null } },
      }),
    ]);

    const attendance = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const row of attendanceGroups) attendance[row.status] = row._count;
    const attendanceTotal =
      attendance.PRESENT + attendance.ABSENT + attendance.LATE + attendance.EXCUSED;

    return {
      roster: { pupils, classes: activeClasses, linkedGuardians: linkedGuardians.length },
      messaging: {
        total: messageTotals,
        receipts: totalReceipts,
        readRate: totalReceipts === 0 ? 0 : Math.round((readCount / totalReceipts) * 100),
        ackRate: totalReceipts === 0 ? 0 : Math.round((ackCount / totalReceipts) * 100),
        byType: Object.fromEntries(messagesByType.map((r) => [r.type, r._count])),
      },
      attendance: {
        ...attendance,
        total: attendanceTotal,
        presentRate:
          attendanceTotal === 0
            ? 0
            : Math.round(((attendance.PRESENT + attendance.LATE) / attendanceTotal) * 100),
      },
    };
  }
}
