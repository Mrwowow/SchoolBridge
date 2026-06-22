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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto, RegisterDeviceTokenDto } from '../../common/dto';
import type { SessionUser } from '@schoolbridge/types';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List the current user’s in-app notifications (cursor-paginated)' })
  list(@CurrentUser() user: SessionUser, @Query() query: PaginationQueryDto) {
    return this.notifications.listForUser(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count unread in-app notifications' })
  unreadCount(@CurrentUser() user: SessionUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: SessionUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register an Expo push token for this device' })
  registerToken(@CurrentUser() user: SessionUser, @Body() dto: RegisterDeviceTokenDto) {
    return this.notifications.registerDeviceToken(user.id, dto.token, dto.platform);
  }

  @Delete('push-token/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'token', description: 'Expo push token to remove' })
  @ApiOperation({ summary: 'Remove a device push token (e.g. on logout)' })
  removeToken(@CurrentUser() user: SessionUser, @Param('token') token: string) {
    return this.notifications.removeDeviceToken(user.id, token);
  }
}
