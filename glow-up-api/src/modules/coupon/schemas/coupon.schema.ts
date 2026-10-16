import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { CouponStatus } from '../enum/coupon.status';

export type CouponDocument = Coupon & Document;

export class CouponServiceSnapshot {
  @Prop({ type: Types.ObjectId, required: true })
  serviceId: Types.ObjectId;
}

export class CouponUsage {
  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  usedAmount: number;

  @Prop({ type: Date, default: Date.now })
  usedAt: Date;
}

@Schema({ timestamps: true })
export class Coupon {

  /* =================================
     Owner (Who Created / Paid)
  ================================= */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  purchaserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceProvider', required: true })
  providerId: Types.ObjectId;


  /* =================================
     Service Info
  ================================= */
 
   @ApiPropertyOptional({
    example: [
        {
            serviceId: '64f8c9b6d3e2c123456789ab'
        }
    ],
    description: 'List of services included in the coupon (snapshot at time of purchase)'
  })
    @Prop({
      type: [CouponServiceSnapshot],
      default: [],
    })
 services?: CouponServiceSnapshot[];

 

@ApiPropertyOptional({
  description: 'List of usage records for this coupon. Each record shows how much of the coupon was used for a specific appointment.',
  example: [
    {
      appointmentId: '64f8c9b6d3e2c123456789ab',
      usedAmount: 30,
      usedAt: '2026-02-12T20:00:00.000Z'
    },
    {
      appointmentId: '64f8c9b6d3e2c123456789ac',
      usedAmount: 70,
      usedAt: '2026-02-12T21:00:00.000Z'
    }
  ]
})
@Prop({ type: [CouponUsage], default: [] })
usageHistory?: CouponUsage[];


    @ApiProperty({
    example: 100,
    description: 'Total price of the coupon at time of purchase',
  })
  @Prop({ required: true })
  totalPrice: number;

  @ApiProperty({
    example: 80,
    description: 'Amount used from the coupon (for partially used coupons)',
  })
  @Prop(
    {
      type: Number,
      required: false,
    }
  )
  usedPrice?: number;
  
  @ApiProperty({ example: 20, description: 'Remaining amount available on the coupon', }) 
  @Prop
  ({ type: Number, required: false, }) 
  remaining?: number;

  /* =================================
     Gift Receiver
  ================================= */
    @ApiPropertyOptional({
    example: '0507882409',
    description: 'Gift recipient phone number (for gift coupons)',
  })
  @Prop({ type: String, required: false })
  receivesPhone?: string;

  /* =================================
     Usage
  ================================= */
  @ApiProperty({
    enum: CouponStatus,
    example: 'ACTIVE',
    description: 'Status of the coupon',
  })
  @Prop({ enum: CouponStatus, default: CouponStatus.ACTIVE })
  status: CouponStatus;

  
//   @Prop()
//   usedDate?: Date;


  /* =================================
     Expiry
  ================================= */
  @ApiProperty({
  example: '2026-08-12T09:43:26.511Z',
  description: 'Expiry date of the coupon (automatically set 6 months from creation)',
})
@Prop({
  default: () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 6); // 6 أشهر من الآن
    return now;
  },
})
expiredAt: Date;

   @ApiProperty({
    example: 'GLOW-1A2B3C',
    description: 'Unique coupon code for redemption',
  })
  @Prop({ type: String, required: true, unique: true })
  code: string;


  

}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
