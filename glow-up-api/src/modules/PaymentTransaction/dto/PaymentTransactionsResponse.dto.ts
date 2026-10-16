import { ApiProperty } from '@nestjs/swagger';
import e from 'express';

export class PaymentTransactionItemDto {

  @ApiProperty({ description: 'ID of the payment transaction' })
  _id: string;

  @ApiProperty({ description: 'ID of the appointment associated with the transaction' })
  appointmentId: string;

  @ApiProperty({ description: 'ID of the payment associated with the transaction' })
  paymentId: string;

  @ApiProperty({ description: 'ID of the provider associated with the transaction' })
  providerId: string;

  @ApiProperty({ description: 'Total amount paid by the customer' })
  totalAmount: number;

  @ApiProperty({ description: 'Amount paid by the customer' })
  paidAmount: number;

  @ApiProperty({ description: 'Commission amount for the platform' })
  commissionAmount: number;

  @ApiProperty({ description: 'Amount received by the provider' })
  providerAmount: number;

  @ApiProperty({ description: 'Source of the payment' })
  paymentSource: string;

  @ApiProperty({ description: 'Status of the payment transaction' })
  status: string;

  @ApiProperty({ description: 'Date and time when the transaction was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date and time when the transaction was last updated' })
  updatedAt: Date;
}

export class PaymentTransactionsResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  totalCommission: number;

  @ApiProperty()
  totalProvider: number;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ type: () => PaymentTransactionItemDto, isArray: true })
  transactions: PaymentTransactionItemDto[];
}