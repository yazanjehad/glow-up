import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscripionStatus } from 'src/common/enum/subscriptionStatus.enum'
import { PaymentMethod } from '../enum/paymentMethode.enum';

export type ProviderSubscriptionDocument = ProviderSubscription & Document;

@Schema({ timestamps: true })
export class ProviderSubscription {

  @Prop({ type: Types.ObjectId, ref: 'ServiceProvider', required: true })
  providerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  planId: Types.ObjectId;

  @Prop({
  type: {
    _id: false,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: false },
    commissionPercent: { type: Number, required: false },
  },
  required: true
  })
  plan: {
    name: string;
    price: number;
    durationDays: number;
    commissionPercent: number;
  };


  @Prop({ required: true })
  startDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({
    default: SubscripionStatus.ACTIVE,
  })
  status: string;

  @Prop({ type: String, default: '' })
  notes?: string;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;
}

export const ProviderSubscriptionSchema =
  SchemaFactory.createForClass(ProviderSubscription);

  ProviderSubscriptionSchema.index({ providerId: 1 });
ProviderSubscriptionSchema.index({ status: 1 });
ProviderSubscriptionSchema.index({ createdAt: -1 });
ProviderSubscriptionSchema.index({ providerId: 1, status: 1, createdAt: -1 });