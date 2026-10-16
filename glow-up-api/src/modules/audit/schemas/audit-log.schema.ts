import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop()
  userId?: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  action: string;

  @Prop()
  method: string;

  @Prop()
  path: string;

  @Prop()
  statusCode: number;

  @Prop({ type: Object })
  oldData?: any;

  @Prop({ type: Object })
  newData?: any;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
