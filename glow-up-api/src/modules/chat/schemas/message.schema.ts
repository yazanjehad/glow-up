import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ enum: ['text', 'image', 'location'], default: 'text' })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: false })
  appointmentId?: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ createdAt: 1 });
