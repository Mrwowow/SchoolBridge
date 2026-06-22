import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LookupUserQueryDto } from '../../common/dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiOperation({ summary: 'List all users in a school' })
  list(@Param('schoolId') schoolId: string) {
    return this.usersService.listBySchool(schoolId);
  }

  @Get('lookup')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiQuery({ name: 'phone', description: 'Phone number to look up', required: true })
  @ApiOperation({ summary: 'Find an existing user by phone (to add as staff)' })
  lookup(@Param('schoolId') schoolId: string, @Query() query: LookupUserQueryDto) {
    return this.usersService.lookupByPhone(query.phone, schoolId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Soft-delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
