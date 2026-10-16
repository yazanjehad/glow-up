import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { PaymentTransactionStatus } from 'src/common/enum/PaymentTransactionStatus.enum';
import { PaymentType } from 'src/modules/appointment/enum/paymenttype.enum';

export type PaymentTransactionDocument = PaymentTransaction & Document;


@Schema({ timestamps: true })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', required: false })
  paymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceProvider', required: true })
  providerId: Types.ObjectId;

  // Financials
  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  paidAmount: number;

  @Prop({ required: true })
  commissionPercent: number;

  @Prop({ required: true })
  commissionAmount: number;

  @Prop({ required: true })
  providerAmount: number;

  // Payment Source
  @Prop({
    type: String,
    enum: PaymentType,
    required: true,
  })
  paymentSource: PaymentType;


  //  Status
  @Prop({
    type: String,
    enum: PaymentTransactionStatus,
    default: PaymentTransactionStatus.PENDING,
  })
  status: PaymentTransactionStatus;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);