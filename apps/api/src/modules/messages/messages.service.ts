import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateMessageDto, ReplyDto, PaginationQuery, Paginated } from '@schoolbridge/types';

type MessageWithMeta = {
  id: string;
  type: string;
  target: string;
  title: string;
  body: string | null;
  attachments: string[];
  dueAt: Date | null;
  createdAt: Date;
  author: { id: string; fullName: string };
  receipts: { pupilId: string; deliveredAt: Date | null; readAt: Date | null; acknowledgedAt: Date | null }[];
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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
        dueAt: true,
        createdAt: true,
        author: { select: { id: true, fullName: true } },
        receipts: {
          where: { pupilId },
          select: { pupilId: true, deliveredAt: true, readAt: true, acknowledgedAt: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const lastItem = items.at(-1);

    return {
      items: items as MessageWithMeta[],
      nextCursor: hasMore && lastItem ? lastItem.id : null,
    };
  }

  // ── Acknowledge ───────────────────────────────────────────────────────

  async acknowledge(messageId: string, pupilId: string): Promise<void> {
    const receipt = await this.prisma.messageReceipt.findUnique({
      where: { messageId_pupilId: { messageId, pupilId } },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    await this.prisma.messageReceipt.update({
      where: { messageId_pupilId: { messageId, pupilId } },
      data: {
        readAt: receipt.readAt ?? new Date(),
        acknowledgedAt: new Date(),
      },
    });
  }

  // ── Reply ─────────────────────────────────────────────────────────────

  async reply(messageId: string, authorId: string, dto: ReplyDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId, deletedAt: null },
    });
    if (!message) throw new NotFoundException('Message not found');

    return this.prisma.reply.create({
      data: { messageId, authorId, body: dto.body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, fullName: true } },
      },
    });
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
    return message;
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
}
