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

import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFeeInvoiceDto, FeesQueryDto, InitPaymentDto } from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('fees')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@ApiParam({ name: 'schoolId', description: 'School tenant ID' })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a fee invoice for a pupil (amount in kobo)' })
  create(@Param('schoolId') schoolId: string, @Body() dto: CreateFeeInvoiceDto) {
    return this.feesService.createInvoice(schoolId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'PARENT')
  @ApiOperation({ summary: 'List fee invoices (filter by pupil/status)' })
  list(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Query() query: FeesQueryDto,
  ) {
    return this.feesService.list(user, schoolId, query);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'PARENT')
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiOperation({ summary: 'Get a fee invoice with its payment history' })
  findOne(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.feesService.findOne(user, schoolId, id);
  }

  @Post(':id/pay')
  @Roles('SCHOOL_ADMIN', 'PARENT')
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiOperation({ summary: 'Initialise a Paystack payment; returns an authorization URL' })
  pay(
    @CurrentUser() user: SessionUser,
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: InitPaymentDto,
  ) {
    return this.feesService.initPayment(user, schoolId, id, dto);
  }
}
