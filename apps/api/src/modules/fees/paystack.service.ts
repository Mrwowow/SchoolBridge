import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

interface InitResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Thin Paystack client (https://paystack.com/docs/api/).
 * Uses global fetch; all calls require PAYSTACK_SECRET_KEY.
 */
@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly base = 'https://api.paystack.co';

  constructor(private readonly config: ConfigService) {}

  private secret(): string {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException('Payments are not configured (missing PAYSTACK_SECRET_KEY)');
    }
    return key;
  }

  /** Initialise a transaction. `amountKobo` must be an integer in kobo. */
  async initializeTransaction(params: {
    email: string;
    amountKobo: number;
    reference: string;
    callbackUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<InitResult> {
    const res = await fetch(`${this.base}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo,
        reference: params.reference,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
    });

    const json = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };

    if (!res.ok || !json.status || !json.data) {
      this.logger.warn(`Paystack init failed: ${json.message}`);
      throw new BadGatewayException(`Paystack: ${json.message ?? 'initialization failed'}`);
    }

    return {
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code,
      reference: json.data.reference,
    };
  }

  /** Verify a webhook signature against the raw request body. */
  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature) return false;
    const hash = createHmac('sha512', this.secret()).update(rawBody).digest('hex');
    // Constant-time compare to avoid leaking the expected signature byte-by-byte
    // via response timing.
    const hashBuf = Buffer.from(hash, 'hex');
    const sigBuf = Buffer.from(signature, 'hex');
    if (hashBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(hashBuf, sigBuf);
  }
}
