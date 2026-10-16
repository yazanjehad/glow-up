import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationStatus, NotificationType } from './schemas/notification.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleType } from '../../common/enum/roletype.enum';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Notifications')
  @ApiHeader({
      name: 'Accept-Language',
      description: 'Language (ar | en)',
      required: false,
      schema: {
        type: 'string',
        default: 'ar',
        enum: ['ar', 'en'],
      },
    })
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new notification (Private or Global)' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

 

   
  @Get()
  @ApiOperation({ summary: 'Get all user notifications (Private & Global) with merged status' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  findAll(
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any,
  ) {
    const userId = req.user.userId || req.user.sub;
    const rawLang = String(req.headers['accept-language'] || '').toLowerCase();
  const lang = rawLang.includes('ar') ? 'ar' : 'en';


    return this.notificationsService.findAllForUser(userId, {
      status,
      type,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    }, lang
  );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread count for both private and global notifications' })
  getUnreadCount(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read (Private or Global)' })
  markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  markAllAsRead(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.notificationsService.findOne(id);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.notificationsService.delete(id);
  // }
}
