import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';

import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BulkAttendanceDto, AttendanceQueryDto } from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('attendance')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('bulk')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiOperation({ summary: 'Record the daily class register (upserts per pupil)' })
  bulk(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: BulkAttendanceDto,
  ) {
    return this.attendanceService.bulkRecord(schoolId, user.id, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiOperation({ summary: 'List attendance records (filter by class/pupil/term/date range)' })
  list(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.list(user, schoolId, query);
  }

  @Get('pupil/:pupilId/summary')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiParam({ name: 'pupilId', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Attendance summary + present-rate for a pupil in a term' })
  summary(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Param('pupilId') pupilId: string,
    @Query('termId') termId: string,
  ) {
    return this.attendanceService.pupilSummary(user, schoolId, pupilId, termId);
  }
}
