import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { CouponUsageDto } from './coupon.usage.dto';
import { PaymentType } from 'src/modules/appointment/enum/paymenttype.enum';
import { IsLocalPhone05 } from 'src/common/validators/is-local-sa-phone.decorator';

export class CouponServiceSnapshotDto {
  @ApiProperty({
    example:[{
      serviceId: '64f8c9b6d3e2c123456789ab'
    },
    {
      serviceId: '64f8c9b6d3e2c123456789ac'
    }
    ],
    description: 'Services ID included in the coupon',
  })
  @IsNotEmpty({ message: 'common.errors.SERVICE_ID_REQUIRED' })
  serviceId: Types.ObjectId;
}

export class CreateCouponDto {

  // /* =================================
  //    Owner (Who Created / Paid)
  // ================================= */
  // @ApiProperty({
  //   example: '698b11112222333344445555',
  //   description: 'ID of the user who purchased the coupon'
  // })
  // @IsNotEmpty()
  // purchaserId: Types.ObjectId;


  @ApiProperty({ 
    example: '698b11112222333344445555',
    description: 'ID of the service provider for which the coupon is being created'
  })
  @IsNotEmpty({message: 'common.errors.PROVIDER_ID_REQUIRED'})
  providerId: Types.ObjectId;
 

  /* =================================
     Service Info
  ================================= */
  @ApiPropertyOptional({
    example: [
      { serviceId: '64f8c9b6d3e2c123456789ab' }
    ],
    description: 'List of services included in the coupon (snapshot at time of purchase)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CouponServiceSnapshotDto)
  services?: CouponServiceSnapshotDto[];

  //   @ApiPropertyOptional({
  //   description: 'List of usage records for this coupon',
  //   example: [
  //     {
  //       appointmentId: '64f8c9b6d3e2c123456789ab',
  //       usedAmount: 30,
  //       usedAt: '2026-02-12T20:00:00.000Z'
  //     }
  //   ]
  // })
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => CouponUsageDto)
  // usageHistory?: CouponUsageDto[];

  // @ApiProperty({
  //   example: 100,
  //   description: 'Total price of the coupon at time of purchase',
  // })
  // @IsNotEmpty()
  // @IsPositive()
  // totalPrice: number;

  /* =================================
     Usage Info
  ================================= */
  // @ApiPropertyOptional({
  //   example: 0,
  //   description: 'Amount used from the coupon (for partially used coupons)',
  // })
  // @IsOptional()
  // usedPrice?: number;

  /* =================================
     Gift Receiver
  ================================= */
  @ApiPropertyOptional({
    example: '0507882409',
    description: 'Gift recipient phone number (for gift coupons)',
  })
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  @IsNotEmpty({message: 'common.errors.RECEIVES_PHONE_REQUIRED'})
  receivesPhone?: string;

  /* =================================
     Usage Status
  ================================= */

//  @IsEnum(['ACTIVE', 'USED', 'EXPIRED'])
//  @IsOptional()
//  status?: string; 

  // @ApiPropertyOptional({
  //   example: '2026-02-18T12:00:00.000Z',
  //   description: 'Date when the coupon was used'
  // })
  // @IsOptional()
  // @IsDate()
  // @Type(() => Date)
  // usedDate?: Date;

  /* =================================
     Expiry
  ================================= */
  // @ApiPropertyOptional({
  //   example: '2026-02-18T12:00:00.000Z',
  //   description: 'Expiry date of the coupon (default 7 days from creation)'
  // })
  // @IsOptional()
  // @IsDate()
  // @Type(() => Date)
  // expiredAt?: Date;

  @ApiPropertyOptional({
     example: 'VISA',
     description: 'Payment method for purchasing the package (VISA or WALLET)',
     enum: PaymentType
   })
   @IsEnum(PaymentType)
   paymentMethod?: PaymentType = PaymentType.VISA;
}
