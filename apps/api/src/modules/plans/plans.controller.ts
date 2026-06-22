import { Controller, Get, Patch, Param, Body, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SchoolPlan } from '@prisma/client';

import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdatePlanDto } from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

/**
 * Plan catalog. Reads are open to any authenticated user (school admins need
 * to see pricing); edits are SUPER_ADMIN-only. No TenantGuard — plans are
 * platform-level, not scoped to a school.
 */
@ApiTags('plans')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plan tiers in the catalog' })
  list() {
    return this.plansService.list();
  }

  @Get(':tier')
  @ApiParam({ name: 'tier', enum: SchoolPlan, description: 'Plan tier key' })
  @ApiOperation({ summary: 'Get a single plan tier' })
  findOne(@Param('tier', new ParseEnumPipe(SchoolPlan)) tier: SchoolPlan) {
    return this.plansService.findOne(tier);
  }

  @Patch(':tier')
  @Roles('SUPER_ADMIN')
  @ApiParam({ name: 'tier', enum: SchoolPlan, description: 'Plan tier key' })
  @ApiOperation({ summary: 'Update a plan tier (price, limits, status) — SUPER_ADMIN only' })
  update(
    @CurrentUser() user: SessionUser,
    @Param('tier', new ParseEnumPipe(SchoolPlan)) tier: SchoolPlan,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(user.id, tier, dto);
  }
}
