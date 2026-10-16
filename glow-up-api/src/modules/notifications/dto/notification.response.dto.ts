import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationStatus,
  NotificationType,
} from '../schemas/notification.schema';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: string;

  @ApiProperty({
    description: 'The user ID who receives the notification',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    example: 'Your appointment is confirmed',
    description: 'Notification title',
  })
  title: string;

  @ApiProperty({
    example: 'Your appointment with Dr. Smith is confirmed',
    description: 'Notification message',
  })
  message: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.APPOINTMENT,
    description: 'Type of notification',
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Related entity ID',
    example: '507f1f77bcf86cd799439011',
  })
  relatedEntityId?: string;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.UNREAD,
    description: 'Notification read status',
  })
  status: NotificationStatus;

  @ApiProperty({
    description: 'Additional data',
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-10T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-10T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class GetNotificationsQueryDto {
  @ApiProperty({
    required: false,
    description: 'Filter by status',
    enum: NotificationStatus,
  })
  status?: NotificationStatus;

  @ApiProperty({
    required: false,
    description: 'Filter by type',
    enum: NotificationType,
  })
  type?: NotificationType;

  @ApiProperty({
    required: false,
    description: 'Page number',
    example: 1,
  })
  page?: number;

  @ApiProperty({
    required: false,
    description: 'Limit per page',
    example: 20,
  })
  limit?: number;
}
