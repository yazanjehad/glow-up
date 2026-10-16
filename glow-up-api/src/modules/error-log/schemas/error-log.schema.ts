import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ErrorLogDocument = ErrorLog & Document;

@Schema({ timestamps: true })
export class ErrorLog {
  @Prop()
  message: string;

  @Prop()
  stack: string;

  @Prop()
  path: string;

  @Prop()
  method: string;

  @Prop()
  statusCode: number;

  @Prop()
  userId?: string;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
