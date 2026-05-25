import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { NotificationDocument } from './schemas/notification.schema';
import { PreferenceDocument } from './schemas/preference.schema';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for a user' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(
    @Query('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{ data: NotificationDocument[]; total: number; page: number; limit: number }> {
    return this.notificationService.getUserNotifications(userId, page, limit);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<NotificationDocument> {
    return this.notificationService.markAsRead(id, userId);
  }

  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update notification preferences' })
  async upsertPreferences(
    @Body() dto: NotificationPreferencesDto,
  ): Promise<PreferenceDocument> {
    return this.notificationService.upsertPreferences(dto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for a user' })
  @ApiQuery({ name: 'userId', required: true })
  async getPreferences(
    @Query('userId') userId: string,
  ): Promise<PreferenceDocument | null> {
    return this.notificationService.getPreferences(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiQuery({ name: 'userId', required: true })
  async getUnreadCount(@Query('userId') userId: string): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }
}
