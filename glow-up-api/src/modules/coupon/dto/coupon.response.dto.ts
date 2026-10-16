import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponStatus } from '../enum/coupon.status';

export class CouponResponseDto {

  @ApiProperty({
    example: '64f8c9b6d3e2c123456789ab',
    description: 'The unique ID of the coupon'
  })
  _id: string;

  @ApiProperty({example: '64f8c9b6d3e2c123456789ab', description: 'the user who purchased the coupon' })
  purchaserId: string;

  @ApiProperty({example: '64f8c9b6d3e2c123456789ab', description: 'The salon(providerId) from which the coupon was purchased' })
  providerId: string;

  @ApiProperty({ example: 100  , description: 'Total price of the coupon' })
  totalPrice: number;

  @ApiPropertyOptional({ example: 80 , description: 'Used price of the coupon' })
  usedPrice?: number;

  @ApiPropertyOptional({ example: 20 , description: 'Remaining amount of the coupon' })
  remaining?: number;

  

  @ApiPropertyOptional({ example: '0507882409', description: 'Gift recipient phone number (for gift coupons)' })
  receivesPhone?: string;

  @ApiProperty({ enum: CouponStatus ,example: 'ACTIVE' , description: 'Status of the coupon(ACTIVE,USED,EXPIRED,PARTIAL_USED,CANCELLED)' })
  status: CouponStatus;

  @ApiProperty({
    example: '2026-02-12T20:00:00.000Z',
    description: 'Date and time when the coupon expires'
  })
  expiredAt: Date;

  @ApiProperty({ example: 'GLOW-ABC123',description: 'Coupon code' })
  code: string;
}
