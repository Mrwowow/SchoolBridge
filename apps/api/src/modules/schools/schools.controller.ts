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

import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSchoolDto, UpdateSchoolDto, AddMemberDto } from '../../common/dto';

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
  create(@Body() body: CreateSchoolDto) {
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
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Get school details' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Update school settings / plan / status' })
  update(@Param('id') id: string, @Body() body: UpdateSchoolDto) {
    return this.schoolsService.update(id, body);
  }

  // ── Members ────────────────────────────────────────────────────────────

  @Get(':id/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'List school members' })
  listMembers(@Param('id') id: string) {
    return this.schoolsService.listMembers(id);
  }

  @Post(':id/members')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiOperation({ summary: 'Add a user to school with a role' })
  addMember(@Param('id') id: string, @Body() body: AddMemberDto) {
    return this.schoolsService.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-school-id', required: true })
  @ApiParam({ name: 'id', description: 'School ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiOperation({ summary: 'Remove a user from school' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: string,
  ) {
    return this.schoolsService.removeMember(id, userId, role);
  }
}
