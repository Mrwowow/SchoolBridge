import { z } from 'zod';
import { MessageType, MessageTarget } from './enums';

export const CreateMessageDto = z
  .object({
    type: MessageType,
    target: MessageTarget,
    /** Required when target = PUPIL. */
    pupilId: z.string().uuid().optional(),
    /** Required when target = CLASS. */
    classId: z.string().uuid().optional(),
    title: z.string().min(1).max(200),
    body: z.string().max(5000).optional(),
    /** Object-store keys of pre-uploaded attachments. */
    attachments: z.array(z.string()).max(10).default([]),
    /** HOMEWORK / EVENT due or occurrence date. */
    dueAt: z.coerce.date().optional(),
  })
  .refine((d) => d.target !== 'PUPIL' || !!d.pupilId, {
    message: 'pupilId is required when target is PUPIL',
    path: ['pupilId'],
  })
  .refine((d) => d.target !== 'CLASS' || !!d.classId, {
    message: 'classId is required when target is CLASS',
    path: ['classId'],
  });
export type CreateMessageDto = z.infer<typeof CreateMessageDto>;

export const ReplyDto = z.object({
  body: z.string().min(1).max(2000),
});
export type ReplyDto = z.infer<typeof ReplyDto>;

export interface MessageReceiptView {
  delivered: boolean;
  read: boolean;
  acknowledged: boolean;
  readAt: string | null;
  acknowledgedAt: string | null;
}
