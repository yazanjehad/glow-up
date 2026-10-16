import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { OtpPurpose } from '../enum/otp-purpose.enum';

@Schema({ timestamps: true })
export class Otp extends Document {
  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ required: true })
  code: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: true })
  expiresAt: Date;
  @Prop({default:OtpPurpose.LOGIN})
  purpose:OtpPurpose;
  @Prop({ required: true })
  resendAvailableAt: Date; // ⏱️ 30 seconds
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
