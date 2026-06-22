import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { AuditService } from '../audit/audit.service';
import { GuardianAccessService } from '../../common/guardian/guardian-access.service';
import type {
  CreateMessageDto,
  ReplyDto,
  PaginationQuery,
  Paginated,
  InboxThreadView,
  HomeworkStatusView,
} from '@schoolbridge/types';

type MessageWithMeta = {
  id: string;
  type: string;
  target: string;
  title: string;
  body: string | null;
  attachments: string[];
  audioUrl: string | null;
  dueAt: Date | null;
  createdAt: Date;
  author: { id: string; fullName: string; role: 'teacher' | 'parent' };
  receipts: { pupilId: string; deliveredAt: Date | null; readAt: Date | null; acknowledgedAt: Date | null }[];
  replyCount: number;
  /** True when this HOMEWORK has a submission for the feed's pupil. */
  submitted?: boolean;
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
    private readonly audit: AuditService,
    private readonly guardian: GuardianAccessService,
  ) {}

  // ── Create message + fan-out receipts ────────────────────────────────────

  async create(
    schoolId: string,
    authorId: string,
    dto: CreateMessageDto,
  ): Promise<{ id: string }> {
    // Resolve recipient pupils for receipt fan-out
    let recipientPupilIds: string[] = [];

    if (dto.target === 'PUPIL') {
      if (!dto.pupilId) throw new BadRequestException('pupilId required for PUPIL target');
      const pupil = await this.prisma.pupil.findFirst({
        where: { id: dto.pupilId, schoolId, deletedAt: null },
      });
      if (!pupil) throw new NotFoundException('Pupil not found in school');
      recipientPupilIds = [dto.pupilId];
    } else if (dto.target === 'CLASS') {
      if (!dto.classId) throw new BadRequestException('classId required for CLASS target');
      const enrollments = await this.prisma.enrollment.findMany({
        where: { classRoomId: dto.classId, pupil: { schoolId, deletedAt: null } },
        select: { pupilId: true },
      });
      recipientPupilIds = enrollments.map((e) => e.pupilId);
    } else {
      // SCHOOL target: all pupils in school
      const pupils = await this.prisma.pupil.findMany({
        where: { schoolId, deletedAt: null },
        select: { id: true },
      });
      recipientPupilIds = pupils.map((p) => p.id);
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          schoolId,
          authorId,
          type: dto.type,
          target: dto.target,
          pupilId: dto.pupilId ?? null,
          classRoomId: dto.classId ?? null,
          title: dto.title,
          body: dto.body ?? null,
          attachments: dto.attachments,
          dueAt: dto.dueAt ?? null,
        },
      });

      if (recipientPupilIds.length > 0) {
        await tx.messageReceipt.createMany({
          data: recipientPupilIds.map((pupilId) => ({
            messageId: msg.id,
            pupilId,
            deliveredAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      return msg;
    });

    // Enqueue push/SMS notifications (fire-and-forget)
    await this.notifications.enqueueMessageFanOut(message.id, recipientPupilIds, schoolId);

    await this.audit.log({
      schoolId,
      userId: authorId,
      action: 'message.create',
      resource: 'Message',
      resourceId: message.id,
      meta: { type: dto.type, target: dto.target, recipients: recipientPupilIds.length },
    });

    return { id: message.id };
  }

  // ── List feed for a pupil (cursor pagination) ─────────────────────────

  async listPupilFeed(
    schoolId: string,
    pupilId: string,
    query: PaginationQuery,
  ): Promise<Paginated<MessageWithMeta>> {
    const { cursor, limit } = query;

    const messages = await this.prisma.message.findMany({
      where: {
        schoolId,
        deletedAt: null,
        receipts: { some: { pupilId } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        target: true,
        title: true,
        body: true,
        attachments: true,
        audioUrl: true,
        dueAt: true,
        createdAt: true,
        author: { select: { id: true, fullName: true } },
        receipts: {
          where: { pupilId },
          select: { pupilId: true, deliveredAt: true, readAt: true, acknowledgedAt: true },
        },
        _count: { select: { replies: true } },
        // Whether THIS pupil has submitted (for HOMEWORK done state).
        submissions: { where: { pupilId }, select: { id: true }, take: 1 },
      },
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    const lastItem = page.at(-1);

    const roles = await this.resolveAuthorRoles(
      schoolId,
      page.map((m) => m.author.id),
    );

    const items: MessageWithMeta[] = page.map((m) => ({
      id: m.id,
      type: m.type,
      target: m.target,
      title: m.title,
      body: m.body,
      attachments: m.attachments,
      audioUrl: m.audioUrl,
      dueAt: m.dueAt,
      createdAt: m.createdAt,
      author: { ...m.author, role: roles.get(m.author.id) ?? 'parent' },
      receipts: m.receipts,
      replyCount: m._count.replies,
      submitted: m.submissions.length > 0,
    }));

    return {
      items,
      nextCursor: hasMore && lastItem ? lastItem.id : null,
    };
  }

  // ── Acknowledge ───────────────────────────────────────────────────────

  async acknowledge(messageId: string, pupilId: string): Promise<void> {
    const receipt = await this.prisma.messageReceipt.findUnique({
      where: { messageId_pupilId: { messageId, pupilId } },
      include: { message: { select: { authorId: true } } },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    const updated = await this.prisma.messageReceipt.update({
      where: { messageId_pupilId: { messageId, pupilId } },
      data: {
        readAt: receipt.readAt ?? new Date(),
        acknowledgedAt: new Date(),
      },
    });

    // Let the author (teacher) see the acknowledgement in realtime.
    this.realtime.emitReceiptUpdated(receipt.message.authorId, {
      messageId,
      pupilId,
      readAt: updated.readAt,
      acknowledgedAt: updated.acknowledgedAt,
    });
  }

  // ── Reply ─────────────────────────────────────────────────────────────

  async reply(messageId: string, authorId: string, dto: ReplyDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId, deletedAt: null },
      select: { id: true, schoolId: true },
    });
    if (!message) throw new NotFoundException('Message not found');

    const reply = await this.prisma.reply.create({
      data: { messageId, authorId, body: dto.body, audioUrl: dto.audioUrl ?? null },
      select: {
        id: true,
        body: true,
        audioUrl: true,
        createdAt: true,
        author: { select: { id: true, fullName: true } },
      },
    });

    const roles = await this.resolveAuthorRoles(message.schoolId, [authorId]);
    return { ...reply, author: { ...reply.author, role: roles.get(authorId) ?? 'parent' } };
  }

  /**
   * Resolve whether each author acts as 'teacher' (any staff membership in the
   * school) or 'parent' (guardian) — used to align message/reply bubbles on the
   * client. One query for the whole set.
   */
  private async resolveAuthorRoles(
    schoolId: string,
    authorIds: string[],
  ): Promise<Map<string, 'teacher' | 'parent'>> {
    const ids = [...new Set(authorIds)];
    const staff = await this.prisma.membership.findMany({
      where: {
        userId: { in: ids },
        schoolId,
        role: { in: ['SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER'] },
      },
      select: { userId: true },
    });
    const staffIds = new Set(staff.map((m) => m.userId));
    return new Map(ids.map((id) => [id, staffIds.has(id) ? 'teacher' : 'parent']));
  }

  // ── Get single message ───────────────────────────────────────────────

  async findOne(messageId: string, schoolId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, schoolId, deletedAt: null },
      include: {
        author: { select: { id: true, fullName: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            body: true,
            audioUrl: true,
            createdAt: true,
            author: { select: { id: true, fullName: true } },
          },
        },
        receipts: {
          select: { pupilId: true, deliveredAt: true, readAt: true, acknowledgedAt: true },
        },
      },
    });
    if (!message) throw new NotFoundException('Message not found');

    // Tag the message author and every reply author with teacher/parent role.
    const roles = await this.resolveAuthorRoles(schoolId, [
      message.authorId,
      ...message.replies.map((r) => r.author.id),
    ]);

    return {
      ...message,
      author: { ...message.author, role: roles.get(message.authorId) ?? 'parent' },
      replies: message.replies.map((r) => ({
        ...r,
        author: { ...r.author, role: roles.get(r.author.id) ?? 'parent' },
      })),
    };
  }

  // ── Soft-delete ───────────────────────────────────────────────────────

  async softDelete(messageId: string, schoolId: string, requesterId: string) {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, schoolId, deletedAt: null },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== requesterId) {
      throw new ForbiddenException('Only the author can delete a message');
    }
    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  }

  // ── Teacher inbox (conversations grouped by pupil) ──────────────────────

  /**
   * Conversation threads for the staff member: PUPIL-targeted messages they
   * authored that have at least one reply, grouped by pupil, newest first.
   */
  async inbox(schoolId: string, authorId: string): Promise<InboxThreadView[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        schoolId,
        deletedAt: null,
        authorId,
        target: 'PUPIL',
        pupilId: { not: null },
        replies: { some: {} },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        pupilId: true,
        pupil: { select: { id: true, fullName: true } },
        replies: {
          orderBy: { createdAt: 'desc' },
          select: { body: true, createdAt: true, authorId: true },
        },
      },
    });

    // Collapse to one thread per pupil (keeping the most recent reply).
    const byPupil = new Map<string, InboxThreadView>();
    for (const m of messages) {
      if (!m.pupilId || !m.pupil) continue;
      if (byPupil.has(m.pupilId)) continue; // messages already newest-first
      const last = m.replies[0];

      // Unread = guardian replies (authorId != teacher) newer than the teacher's
      // own latest reply in this thread. If the teacher never replied, every
      // guardian reply counts.
      const lastTeacherReplyAt = m.replies
        .filter((r) => r.authorId === authorId)
        .reduce<Date | null>((acc, r) => (acc && acc > r.createdAt ? acc : r.createdAt), null);
      const unread = m.replies.filter(
        (r) => r.authorId !== authorId && (!lastTeacherReplyAt || r.createdAt > lastTeacherReplyAt),
      ).length;

      byPupil.set(m.pupilId, {
        pupilId: m.pupilId,
        pupilName: m.pupil.fullName,
        lastMessage: last?.body ?? '',
        lastAt: (last?.createdAt ?? new Date()).toISOString(),
        unread,
        parentName: null,
      });
    }

    // Resolve a primary guardian name per pupil for display.
    const pupilIds = [...byPupil.keys()];
    if (pupilIds.length > 0) {
      const links = await this.prisma.guardianLink.findMany({
        where: { pupilId: { in: pupilIds } },
        orderBy: { isPrimary: 'desc' },
        select: { pupilId: true, user: { select: { fullName: true } } },
      });
      for (const link of links) {
        const thread = byPupil.get(link.pupilId);
        if (thread && !thread.parentName) thread.parentName = link.user.fullName;
      }
    }

    return [...byPupil.values()];
  }

  // ── Class homework status (submitted / total) ───────────────────────────

  async homeworkStatus(schoolId: string, classId: string): Promise<HomeworkStatusView[]> {
    // Pupils currently enrolled in the class — the denominator, and the set
    // used to pick up PUPIL-targeted homework addressed to class members.
    const enrolled = await this.prisma.enrollment.findMany({
      where: { classRoomId: classId, leftAt: null, pupil: { schoolId } },
      select: { pupilId: true },
    });
    const enrolledIds = enrolled.map((e) => e.pupilId);
    const total = enrolledIds.length;

    const homework = await this.prisma.message.findMany({
      where: {
        schoolId,
        deletedAt: null,
        type: 'HOMEWORK',
        OR: [
          // Homework addressed to the whole class…
          { classRoomId: classId },
          // …or to an individual pupil who is in this class.
          { target: 'PUPIL', pupilId: { in: enrolledIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        dueAt: true,
        _count: { select: { submissions: true } },
      },
    });

    return homework.map((h) => ({
      messageId: h.id,
      title: h.title,
      dueAt: h.dueAt ? h.dueAt.toISOString() : null,
      submitted: h._count.submissions,
      total,
    }));
  }

  // ── Homework submission (parent/teacher marks a pupil done) ─────────────

  async submitHomework(
    schoolId: string,
    messageId: string,
    pupilId: string,
    actor: { id: string; isElevated: boolean },
  ): Promise<{ submitted: boolean }> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, schoolId, deletedAt: null, type: 'HOMEWORK' },
      select: { id: true },
    });
    if (!message) throw new NotFoundException('Homework not found');

    // A parent may only submit for a pupil they guard.
    if (!actor.isElevated) {
      await this.guardian.assertGuardianOf(schoolId, actor.id, pupilId);
    }

    await this.prisma.homeworkSubmission.upsert({
      where: { messageId_pupilId: { messageId, pupilId } },
      create: { messageId, pupilId },
      update: {},
    });
    return { submitted: true };
  }
}
