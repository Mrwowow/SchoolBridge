import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';

import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateAcademicYearDto, CreateTermDto } from '../../common/dto';

@ApiTags('academic')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('years')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiOperation({ summary: 'List academic years with their terms' })
  listYears(@Param('schoolId') schoolId: string) {
    return this.academicService.listYears(schoolId);
  }

  @Post('years')
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create an academic year' })
  createYear(@Param('schoolId') schoolId: string, @Body() dto: CreateAcademicYearDto) {
    return this.academicService.createYear(schoolId, dto);
  }

  @Post('terms')
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a term within an academic year' })
  createTerm(@Param('schoolId') schoolId: string, @Body() dto: CreateTermDto) {
    return this.academicService.createTerm(schoolId, dto);
  }

  @Post('terms/:termId/set-current')
  @Roles('SCHOOL_ADMIN')
  @ApiParam({ name: 'termId', description: 'Term ID' })
  @ApiOperation({ summary: 'Mark a term as the current term (unsets the previous current)' })
  setCurrentTerm(
    @Param('schoolId') schoolId: string,
    @Param('termId') termId: string,
  ) {
    return this.academicService.setCurrentTerm(schoolId, termId);
  }
}
