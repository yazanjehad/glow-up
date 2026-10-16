import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  APPOINTMENT = 'appointment',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  REMINDER = 'reminder',
  chat = 'chat',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @ApiProperty({
    description: 'The user ID who receives the notification',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId: Types.ObjectId;

  @ApiProperty({
    example: 'Your appointment is confirmed',
    description: 'Notification title',
  })
  @Prop({
    type:{
      ar: { type: String, required: true },
      en: { type: String, required: true },
  }, required: true ,_id:false})
  title: {
    ar: string;
    en: string;
  };

  @ApiProperty({
    example: 'Your appointment with Dr. Smith is confirmed for tomorrow at 10:00 AM',
    description: 'Notification message',
  })
  @Prop({
    type:{
      ar: { type: String, required: true },
      en: { type: String, required: true },
    }, required: true ,_id:false})
  message: {
    ar: string;
    en: string;
  };

  @ApiProperty({ description: 'link_to saloon' })
  @Prop()
  link_to: string;

  @Prop({ default: false })
  global?: boolean;

  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.APPOINTMENT,
    description: 'Type of notification',
  })
  @Prop({
    type: String,
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'Related entity ID (e.g., appointment ID)',
  })
  @Prop({ type: Types.ObjectId, ref: 'Appointment', default: null })
  relatedEntityId?: Types.ObjectId;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.UNREAD,
    description: 'Notification read status',
  })
  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Additional data as JSON string',
  })
  @Prop({ type: Object, default: {} })
  data?: Record<string, any>;




}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index for efficient querying
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, status: 1 });
//delete after 60 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 5184000 }
);
