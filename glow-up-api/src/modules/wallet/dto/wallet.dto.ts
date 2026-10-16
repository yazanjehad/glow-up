import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO لشحن الرصيد (CREDIT)
 */
export class AddWalletDto {
  @ApiProperty({
    example: 50,
    description: 'Amount to add to the wallet',
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    example: 'شحن رصيد',
    description: 'Optional description for the transaction',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO لخصم الرصيد (DEBIT)
 */
export class DeductWalletDto {
  @ApiProperty({
    example: 30,
    description: 'Amount to deduct from the wallet',
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    example: 'شراء خدمة تنظيف',
    description: 'Optional description for the transaction',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO لسجل كل معاملة داخل المحفظة
 */
export class WalletTransactionResponseDto {
  @ApiProperty({
    example: 50,
    description: 'Amount of the transaction',
  })
  amount: number;

  @ApiProperty({
    enum: ['CREDIT', 'DEBIT'],
    example: 'CREDIT',
    description: 'Type of transaction',
  })
  type: 'CREDIT' | 'DEBIT';

  @ApiPropertyOptional({
    example: 'شحن رصيد',
    description: 'Description of the transaction',
  })
  description?: string;

  @ApiProperty({
    example: '2026-02-16T12:00:00.000Z',
    description: 'Timestamp of the transaction',
  })
  createdAt: Date;
}

/**
 * DTO لإرجاع بيانات المحفظة
 */
export class WalletResponseDto {
  @ApiProperty({
    example: '64b8e6b6f1c4c6d8c4d3e2a1',
    description: 'User ID',
  })
  userId: string;

  @ApiProperty({
    example: 100,
    description: 'Current wallet balance',
  })
  balance: number;

  @ApiProperty({
    type: [WalletTransactionResponseDto],
    description: 'Transaction history',
  })
  transactions: WalletTransactionResponseDto[];
}
