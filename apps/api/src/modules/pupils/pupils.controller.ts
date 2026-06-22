import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';

import { PupilsService } from './pupils.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreatePupilDto,
  UpdatePupilDto,
  LinkGuardianDto,
  EnrollPupilDto,
  PaginationQueryDto,
  UpsertDaySubjectNoteDto,
  UpsertBehaviourRatingDto,
  CreatePupilBadgeDto,
} from '../../common/dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('pupils')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/pupils')
export class PupilsController {
  constructor(private readonly pupilsService: PupilsService) {}

  @Post()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiOperation({ summary: 'Create a pupil' })
  create(@Param('schoolId') schoolId: string, @Body() dto: CreatePupilDto) {
    return this.pupilsService.create(schoolId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiOperation({ summary: 'List pupils (cursor-paginated, optional classId filter)' })
  list(
    @Param('schoolId') schoolId: string,
    @Query() query: PaginationQueryDto,
    @Query('classId') classId?: string,
  ) {
    return this.pupilsService.list(schoolId, { ...query, classId });
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Get a pupil with guardians and current enrollments' })
  findOne(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.pupilsService.findOne(schoolId, id);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Update a pupil' })
  update(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePupilDto,
  ) {
    return this.pupilsService.update(schoolId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Soft-delete a pupil' })
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.pupilsService.softDelete(schoolId, id);
  }

  // ── Guardian links ──────────────────────────────────────────────────────────

  @Post(':id/guardians')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Link a guardian (existing school member) to a pupil' })
  linkGuardian(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: LinkGuardianDto,
  ) {
    return this.pupilsService.linkGuardian(schoolId, id, dto);
  }

  @Delete(':id/guardians/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiParam({ name: 'userId', description: 'Guardian user ID' })
  @ApiOperation({ summary: 'Unlink a guardian from a pupil' })
  unlinkGuardian(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.pupilsService.unlinkGuardian(schoolId, id, userId);
  }

  // ── Enrollment ──────────────────────────────────────────────────────────────

  @Post(':id/enrollments')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Enroll a pupil into a class' })
  enroll(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: EnrollPupilDto,
  ) {
    return this.pupilsService.enroll(schoolId, id, dto);
  }

  @Delete(':id/enrollments/:classRoomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiParam({ name: 'classRoomId', description: 'Class ID' })
  @ApiOperation({ summary: 'Unenroll a pupil from a class' })
  unenroll(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Param('classRoomId') classRoomId: string,
  ) {
    return this.pupilsService.unenroll(schoolId, id, classRoomId);
  }

  // ── Day notes ───────────────────────────────────────────────────────────────

  @Post(':id/day-notes')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Upsert a day subject note for a pupil' })
  upsertDayNote(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpsertDaySubjectNoteDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.pupilsService.upsertDayNote(schoolId, id, user.id, dto);
  }

  // ── Behaviour ratings ────────────────────────────────────────────────────────

  @Post(':id/behaviour')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Upsert daily behaviour ratings for a pupil' })
  upsertBehaviour(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpsertBehaviourRatingDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.pupilsService.upsertBehaviour(schoolId, id, user.id, dto);
  }

  // ── Badges ──────────────────────────────────────────────────────────────────

  @Post(':id/badges')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Award a milestone badge to a pupil' })
  createBadge(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: CreatePupilBadgeDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.pupilsService.upsertBadge(schoolId, id, dto);
  }

  @Get(':id/badges')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'id', description: 'Pupil ID' })
  @ApiOperation({ summary: 'List badges awarded to a pupil' })
  listBadges(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.pupilsService.listBadges(schoolId, id);
  }
}
