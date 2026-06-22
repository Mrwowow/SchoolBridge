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

import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpsertResultDto, ResultsQueryDto } from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('results')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiOperation({ summary: 'Create or update an assessment result' })
  upsert(@Param('schoolId') schoolId: string, @Body() dto: UpsertResultDto) {
    return this.resultsService.upsert(schoolId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiOperation({ summary: 'List assessment results (filter by pupil/term/subject)' })
  list(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Query() query: ResultsQueryDto,
  ) {
    return this.resultsService.list(user, schoolId, query);
  }

  @Get('pupil/:pupilId/sheet')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiParam({ name: 'pupilId', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Term result sheet for a pupil with aggregate totals' })
  sheet(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Param('pupilId') pupilId: string,
    @Query('termId') termId: string,
  ) {
    return this.resultsService.pupilTermSheet(user, schoolId, pupilId, termId);
  }
}
