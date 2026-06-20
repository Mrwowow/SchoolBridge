import {
  Controller,
  Get,
  Post,
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

import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMessageDto,
  ReplyDto,
  PaginationQueryDto,
} from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('messages')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'x-school-id', description: 'Active school tenant ID', required: true })
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('schools/:schoolId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiOperation({ summary: 'Create a message with automatic receipt fan-out' })
  create(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(schoolId, user.id, dto);
  }

  @Get('pupil/:pupilId')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiParam({ name: 'pupilId', description: 'Pupil ID' })
  @ApiOperation({ summary: 'List message feed for a specific pupil (cursor-paginated)' })
  listPupilFeed(
    @Param('schoolId') schoolId: string,
    @Param('pupilId') pupilId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.messagesService.listPupilFeed(schoolId, pupilId, query);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiOperation({ summary: 'Get a single message with replies and receipts' })
  findOne(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
  ) {
    return this.messagesService.findOne(id, schoolId);
  }

  @Post(':id/acknowledge/:pupilId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('PARENT', 'SCHOOL_ADMIN', 'CLASS_TEACHER')
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiParam({ name: 'pupilId', description: 'Pupil ID' })
  @ApiOperation({ summary: 'Acknowledge (read + confirm) a message for a pupil' })
  acknowledge(
    @Param('id') id: string,
    @Param('pupilId') pupilId: string,
  ) {
    return this.messagesService.acknowledge(id, pupilId);
  }

  @Post(':id/replies')
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER', 'PARENT')
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiOperation({ summary: 'Reply to a message thread' })
  reply(
    @Param('id') messageId: string,
    @CurrentUser() user: SessionUser,
    @Body() dto: ReplyDto,
  ) {
    return this.messagesService.reply(messageId, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SCHOOL_ADMIN', 'CLASS_TEACHER', 'TEACHER')
  @ApiParam({ name: 'schoolId', description: 'School tenant ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiOperation({ summary: 'Soft-delete a message (author only)' })
  remove(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.messagesService.softDelete(id, schoolId, user.id);
  }
}
