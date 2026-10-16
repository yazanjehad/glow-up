import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PlanType } from 'src/common/enum/planType.enum';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true })
export class SubscriptionPlan {

  @Prop({ required: true })
  name: string;

 @Prop({ required: true })
  type:PlanType;
  
  @Prop()
  price: number;

  @Prop()
  durationDays: number;

  @Prop()
  commissionPercent: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SubscriptionPlanSchema =
  SchemaFactory.createForClass(SubscriptionPlan);