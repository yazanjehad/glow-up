import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponStatus } from '../enum/coupon.status';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCouponsFilterDto {

  @ApiPropertyOptional({
    enum: CouponStatus,
    description: 'Coupon status',
  })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;


  @ApiPropertyOptional({
     description: 'Page number',
     default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;


  @ApiPropertyOptional({
    description: 'Limit per page',
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50) // حماية
  limit: number = 10;
}
