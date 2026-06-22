import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { WebhooksController } from './webhooks.controller';
import { FeesService } from './fees.service';
import { PaystackService } from './paystack.service';

@Module({
  controllers: [FeesController, WebhooksController],
  providers: [FeesService, PaystackService],
})
export class FeesModule {}
