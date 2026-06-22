import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
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

import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateClassDto, UpdateClassDto } from '../../common/dto';

@ApiTags('classes')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a class' })
  create(@Param('schoolId') schoolId: string, @Body() dto: CreateClassDto) {
    return this.classesService.create(schoolId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiOperation({ summary: 'List classes with active enrollment counts' })
  list(@Param('schoolId') schoolId: string) {
    return this.classesService.list(schoolId);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiOperation({ summary: 'Get a class with its enrolled pupils' })
  findOne(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.classesService.findOne(schoolId, id);
  }

  @Get(':id/report-status')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiOperation({
    summary: "Per-pupil daily status (attendance + whether today's report was recorded)",
  })
  reportStatus(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.classesService.reportStatus(
      schoolId,
      id,
      date ? new Date(date) : undefined,
    );
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN')
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiOperation({ summary: 'Update a class' })
  update(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(schoolId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SCHOOL_ADMIN')
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiOperation({ summary: 'Delete a class (only when it has no active enrollments)' })
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.classesService.remove(schoolId, id);
  }
}
