import { Types } from 'mongoose';
import { IsMongoId, IsNumber } from 'class-validator';
import { PaymentType } from 'src/modules/appointment/enum/paymenttype.enum';

export class CreatePaymentTransactionDto {
  
  @IsMongoId()
  appointmentId: Types.ObjectId;

  @IsMongoId()
  paymentId: Types.ObjectId;

  @IsMongoId()
  providerId: Types.ObjectId;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  commissionPercent: number;

  @IsNumber()
  paidAmount: number;

  paymentSource: PaymentType;
}