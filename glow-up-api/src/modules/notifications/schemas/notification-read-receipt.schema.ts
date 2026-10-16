import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
@Schema({ timestamps: true })
export class NotificationReadReceipt extends Document {
  @Prop({ required: true })
  NotificationId: string;

  @Prop({ required: true })
  UserId: string;

  @Prop({ default: false })
  Read: boolean;
}

export const NotificationReadReceiptSchema =
  SchemaFactory.createForClass(NotificationReadReceipt);
