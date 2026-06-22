import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('parents')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  /**
   * GET /schools/:schoolId/parents/me/pupils
   * Returns the list of pupils the authenticated parent guards in this school.
   */
  @Get('me/pupils')
  @Roles('PARENT', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List pupils guarded by the authenticated parent' })
  myPupils(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
  ) {
    return this.parentsService.myPupils(schoolId, user.id);
  }

  /**
   * GET /schools/:schoolId/parents/:pupilId/day-summary
   * Returns attendance, subject notes and behaviour ratings for a single day.
   */
  @Get(':pupilId/day-summary')
  @Roles('PARENT', 'SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'pupilId', description: 'Pupil ID' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'ISO date YYYY-MM-DD (defaults to today UTC)',
  })
  @ApiOperation({ summary: "Pupil's daily summary — attendance, subjects, behaviour" })
  daySummary(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Param('pupilId') pupilId: string,
    @Query('date') date?: string,
  ) {
    return this.parentsService.daySummary(user, schoolId, pupilId, date);
  }

  /**
   * GET /schools/:schoolId/parents/:pupilId/progress
   * Returns the term progress report card for a pupil.
   */
  @Get(':pupilId/progress')
  @Roles('PARENT', 'SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'pupilId', description: 'Pupil ID' })
  @ApiQuery({
    name: 'termId',
    required: false,
    description: 'Term ID (defaults to the current term for the school)',
  })
  @ApiOperation({ summary: "Pupil's term progress — averages, rank, attendance, badges" })
  progress(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Param('pupilId') pupilId: string,
    @Query('termId') termId?: string,
  ) {
    return this.parentsService.progress(user, schoolId, pupilId, termId);
  }
}
