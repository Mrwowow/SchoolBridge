import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * Platform-level (cross-tenant) endpoints for the Super Admin.
 * No TenantGuard / x-school-id — these aggregate across all schools.
 */
@ApiTags('platform')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Platform-wide analytics across all schools (SUPER_ADMIN only)' })
  overview() {
    return this.platformService.overview();
  }
}
