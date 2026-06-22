import { z } from 'zod';

const id = () => z.string().min(1);

/** Create a fee invoice for a pupil. Amount is in kobo (₦1 = 100 kobo). */
export const CreateFeeInvoiceDto = z.object({
  pupilId: id(),
  description: z.string().min(2).max(200),
  amountKobo: z.coerce.number().int().positive(),
  dueAt: z.coerce.date(),
});
export type CreateFeeInvoiceDto = z.infer<typeof CreateFeeInvoiceDto>;

export const FeesQuery = z.object({
  pupilId: id().optional(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
});
export type FeesQuery = z.infer<typeof FeesQuery>;

/** Initialise a Paystack payment for an invoice. */
export const InitPaymentDto = z.object({
  email: z.string().email(),
  /** Where Paystack redirects after payment (mobile/web deep link). */
  callbackUrl: z.string().url().optional(),
});
export type InitPaymentDto = z.infer<typeof InitPaymentDto>;
