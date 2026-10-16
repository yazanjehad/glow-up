import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'The user ID who receives the notification. Can be a single user ID, array of IDs, or "all"',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  userId: string | string[] | 'all';

  @ApiProperty({
    example: { ar: 'موعد جديد', en: 'New Appointment' } ,
    description: 'Notification title',
  })
  @IsObject()
  @IsNotEmpty()
  title: {
    ar: string;
    en: string;
  };

  @ApiProperty({
    example: { ar: 'موعدك مع  تم تأكيده', en: 'Your appointment with  is confirmed' },
    description: 'Notification message',
  })
  @IsObject()
  @IsNotEmpty()
  message: {
    ar: string;
    en: string;
  };

   @ApiProperty({ example: '63f1a2b3c4d5e6f7a8b9c0d2' })
    @IsString()
    @IsOptional()
    link_to: string;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.APPOINTMENT,
    description: 'Type of notification',
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({
    description: 'Related entity ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({
    description: 'Additional data',
    example: { appointmentDate: '2024-01-10T10:00:00Z' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
