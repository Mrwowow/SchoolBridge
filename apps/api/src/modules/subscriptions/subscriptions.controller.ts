import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpsertSubscriptionDto } from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

/**
 * Cross-tenant billing management for the Super Admin.
 * No TenantGuard — these span schools.
 */
@ApiTags('subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscriptions across schools (SUPER_ADMIN only)' })
  list() {
    return this.subscriptionsService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a school subscription + sync the school plan' })
  upsert(@CurrentUser() user: SessionUser, @Body() dto: UpsertSubscriptionDto) {
    return this.subscriptionsService.upsert(user.id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiOperation({ summary: 'Cancel a subscription' })
  cancel(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.subscriptionsService.cancel(user.id, id);
  }
}
