import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { BreakStatus } from 'src/common/enum/break-status.enum';

export type CustomBreakDocument = CustomBreak & Document;

@Schema({
  timestamps: true,
  collection: 'custom_breaks',
})
export class CustomBreak {

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
    index: true,
  })
  providerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Employee',
    required: true, 
    index: true,
  })
  employeeId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  reason?: string;

  @Prop({
    type: String,
    enum: BreakStatus,
    default: BreakStatus.PENDING,
    index: true,
  })
  status: BreakStatus;
}

export const CustomBreakSchema =
  SchemaFactory.createForClass(CustomBreak);

  CustomBreakSchema.index({ providerId: 1, date: 1 });
CustomBreakSchema.index({ employeeId: 1, date: 1 });
CustomBreakSchema.index({ providerId: 1, employeeId: 1, date: 1 });