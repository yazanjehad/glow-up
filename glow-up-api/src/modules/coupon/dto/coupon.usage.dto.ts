import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CouponUsageDto {
  @ApiProperty({
    description: 'ID of the appointment where the coupon was used',
    example: '64f8c9b6d3e2c123456789ab',
  })
  @IsMongoId()
  appointmentId: string;

  @ApiProperty({
    description: 'Amount used from the coupon for this appointment',
    example: 30,
  })
  @IsNumber()
  usedAmount: number;

  @ApiProperty({
    description: 'Date and time when the coupon was used for this appointment',
    example: '2026-02-12T20:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  usedAt: Date;
}
