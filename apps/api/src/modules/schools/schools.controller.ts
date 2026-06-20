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
  ApiBody,
} from '@nestjs/swagger';

import { SchoolsService, CreateSchoolInput, UpdateSchoolInput } from './schools.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('schools')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  // ── SUPER_ADMIN-only endpoints (no tenant required) ────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new school (SUPER_ADMIN only)' })
  create(@Body() body: CreateSchoolInput) {
    return this.schoolsService.create(body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List all schools (SUPER_ADMIN only)' })
  findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiOperation({ summary: 'Get school details' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiOperation({ summary: 'Update school settings / plan / status' })
  update(@Param('id') id: string, @Body() body: UpdateSchoolInput) {
    return this.schoolsService.update(id, body);
  }

  // ── Members ────────────────────────────────────────────────────────────

  @Get(':id/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiOperation({ summary: 'List school members' })
  listMembers(@Param('id') id: string) {
    return this.schoolsService.listMembers(id);
  }

  @Post(':id/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiOperation({ summary: 'Add a user to school with a role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        role: { type: 'string', enum: ['SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT'] },
      },
      required: ['userId', 'role'],
    },
  })
  addMember(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('role') role: string,
  ) {
    return this.schoolsService.addMember(id, userId, role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiOperation({ summary: 'Remove a user from school' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: string,
  ) {
    return this.schoolsService.removeMember(id, userId, role);
  }
}
