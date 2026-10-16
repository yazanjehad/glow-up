import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentItemResponseDto {
  @ApiProperty({ example: 'HAIRCUT' })
  serviceId: string;

  @ApiProperty({ example: 'Men Haircut' })
  name: string;

  @ApiProperty({ example: 25 })
  price: number;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 30 })
  durationMinutes: number;
}

export class PaymentAmountResponseDto {
  @ApiProperty({ example: 25 })
  subtotal: number;

  @ApiProperty({ example: 0 })
  discount: number;

  @ApiProperty({ example: 0 })
  tax: number;

  @ApiProperty({ example: 25 })
  total: number;
}

export class PaymentResponseDto {
  @ApiProperty({ example: '65b2a7f9c8d1e2f3a4b5c6d7' })
  _id: string;

  @ApiProperty({ example: '65b2a7f9c8d1e2f3a4b5c6d7', description: 'Customer User ID' })
  customerId: string;

  @ApiProperty({ example: '65b2a7f9c8d1e2f3a4b5c6d7', description: 'Appointment ID' })
  appointmentId: string;

  @ApiProperty({ example: '65b2a7f9c8d1e2f3a4b5c6d7', description: 'Provider ID' })
  providerId: string;

  @ApiProperty({ type: [PaymentItemResponseDto] })
  items: PaymentItemResponseDto[];

  @ApiProperty({ type: PaymentAmountResponseDto })
  amount: PaymentAmountResponseDto;

  @ApiProperty({ enum: ['CASH', 'CARD', 'ONLINE'], example: 'CASH' })
  method: string;

  @ApiProperty({ enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], example: 'PENDING' })
  status: string;

  @ApiPropertyOptional({ example: 'tx_123456789' })
  transactionRef?: string;

  @ApiProperty({ example: '2026-01-25T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-25T12:00:00.000Z' })
  updatedAt: Date;
}