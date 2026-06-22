import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { FeesService } from './fees.service';
import { PaystackService } from './paystack.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly feesService: FeesService,
    private readonly paystack: PaystackService,
  ) {}

  @Public()
  @Post('paystack')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Paystack payment webhook (HMAC-verified)' })
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const raw = req.rawBody;
    if (!raw || !this.paystack.verifyWebhookSignature(raw, signature)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const event = JSON.parse(raw.toString('utf8')) as {
      event: string;
      data?: { reference?: string };
    };
    return this.feesService.handlePaystackEvent(event);
  }
}
