import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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

import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSubjectDto, UpdateSubjectDto } from '../../common/dto';

@ApiTags('subjects')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiOperation({ summary: 'Create a subject' })
  create(@Param('schoolId') schoolId: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(schoolId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiOperation({ summary: 'List subjects' })
  list(@Param('schoolId') schoolId: string) {
    return this.subjectsService.list(schoolId);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN')
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiOperation({ summary: 'Update a subject' })
  update(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(schoolId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SCHOOL_ADMIN')
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiOperation({ summary: 'Delete a subject' })
  remove(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.subjectsService.remove(schoolId, id);
  }
}
