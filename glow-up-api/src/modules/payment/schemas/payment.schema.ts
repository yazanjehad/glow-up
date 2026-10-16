import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentType } from '../../appointment/enum/paymenttype.enum';
export type PaymentDocument = HydratedDocument<Payment>;


@Schema({ _id: false })
export class PaymentItem {
  @Prop({ required: true })
  serviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 1 })
  quantity: number;

  @Prop()
  durationMinutes: number;
}

const PaymentItemSchema = SchemaFactory.createForClass(PaymentItem);

@Schema({ _id: false })
export class PaymentAmount {
  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;
}

const PaymentAmountSchema = SchemaFactory.createForClass(PaymentAmount);

/* ================= MAIN SCHEMA ================= */

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: false, index: true })
  couponId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: false})
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', required: true }) 
  providerId: Types.ObjectId;

  // Snapshot of purchased services
  @Prop({ type: [PaymentItemSchema], default: [] })
  items: PaymentItem[];

  // Pricing
  @Prop({ type: PaymentAmountSchema, required: true })
  amount: PaymentAmount;

  // Payment method
  @Prop({
    type: String,
    enum: PaymentType,
    required: true,
  })
  method: PaymentType;

  // packageId is optional, only for package payments
  @Prop({ type: Types.ObjectId })
  packageId?: Types.ObjectId;


  // Payment status
  @Prop({
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
    index: true,
  })
  status: string;

  // External payment reference (Stripe, PayPal, etc.)
  @Prop()
  transactionRef?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);