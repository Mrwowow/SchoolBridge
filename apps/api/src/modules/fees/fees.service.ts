import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { GuardianAccessService } from '../../common/guardian/guardian-access.service';
import { PaystackService } from './paystack.service';
import type {
  CreateFeeInvoiceDto,
  FeesQuery,
  InitPaymentDto,
  SessionUser,
} from '@schoolbridge/types';

function serialiseInvoice<T extends { amountKobo: bigint }>(inv: T) {
  return { ...inv, amountKobo: Number(inv.amountKobo) };
}

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackService,
    private readonly guardian: GuardianAccessService,
  ) {}

  // ── Invoices ────────────────────────────────────────────────────────────────

  async createInvoice(schoolId: string, dto: CreateFeeInvoiceDto) {
    const pupil = await this.prisma.pupil.findFirst({
      where: { id: dto.pupilId, schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!pupil) throw new NotFoundException('Pupil not found in this school');

    const invoice = await this.prisma.feeInvoice.create({
      data: {
        schoolId,
        pupilId: dto.pupilId,
        description: dto.description,
        amountKobo: BigInt(dto.amountKobo),
        dueAt: dto.dueAt,
      },
    });
    return serialiseInvoice(invoice);
  }

  async list(user: SessionUser, schoolId: string, query: FeesQuery) {
    // Parents only see invoices for their own children; elevated roles see all.
    const pupilScope = await this.guardian.pupilFilter(user, schoolId, query.pupilId);
    const invoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        ...pupilScope,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { dueAt: 'asc' },
      include: { pupil: { select: { id: true, fullName: true } } },
    });
    return invoices.map(serialiseInvoice);
  }

  async findOne(user: SessionUser, schoolId: string, id: string) {
    const invoice = await this.prisma.feeInvoice.findFirst({
      where: { id, schoolId },
      include: {
        pupil: { select: { id: true, fullName: true } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // A parent may only view invoices for a pupil they guard.
    if (!this.guardian.isElevated(user, schoolId)) {
      await this.guardian.assertGuardianOf(schoolId, user.id, invoice.pupilId);
    }

    return {
      ...serialiseInvoice(invoice),
      payments: invoice.payments.map((p) => ({ ...p, amountKobo: Number(p.amountKobo) })),
    };
  }

  // ── Payment initialisation (Paystack) ─────────────────────────────────────────

  async initPayment(
    user: SessionUser,
    schoolId: string,
    invoiceId: string,
    dto: InitPaymentDto,
  ) {
    const invoice = await this.prisma.feeInvoice.findFirst({
      where: { id: invoiceId, schoolId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // A parent may only pay invoices for a pupil they guard.
    if (!this.guardian.isElevated(user, schoolId)) {
      await this.guardian.assertGuardianOf(schoolId, user.id, invoice.pupilId);
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already paid');
    }

    const reference = `SB-${invoice.id}-${randomUUID().slice(0, 8)}`;
    const amountKobo = Number(invoice.amountKobo);

    const init = await this.paystack.initializeTransaction({
      email: dto.email,
      amountKobo,
      reference,
      callbackUrl: dto.callbackUrl,
      metadata: { invoiceId: invoice.id, schoolId, pupilId: invoice.pupilId },
    });

    await this.prisma.payment.create({
      data: {
        feeInvoiceId: invoice.id,
        reference,
        amountKobo: invoice.amountKobo,
        status: 'PENDING',
        gateway: 'paystack',
      },
    });

    return { authorizationUrl: init.authorizationUrl, reference };
  }

  // ── Webhook (Paystack → confirm payment) ──────────────────────────────────────

  async handlePaystackEvent(event: { event: string; data?: { reference?: string } }) {
    if (event.event !== 'charge.success') {
      this.logger.debug(`Ignoring Paystack event: ${event.event}`);
      return { handled: false };
    }

    const reference = event.data?.reference;
    if (!reference) return { handled: false };

    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { feeInvoice: { select: { id: true } } },
    });
    if (!payment) {
      this.logger.warn(`Webhook for unknown payment reference: ${reference}`);
      return { handled: false };
    }
    if (payment.status === 'PAID') return { handled: true }; // idempotent

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { reference },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          gatewayMetadata: event.data as object,
        },
      }),
      this.prisma.feeInvoice.update({
        where: { id: payment.feeInvoice.id },
        data: { status: 'PAID' },
      }),
    ]);

    this.logger.log(`Payment ${reference} confirmed → invoice ${payment.feeInvoice.id} marked PAID`);
    return { handled: true };
  }
}
