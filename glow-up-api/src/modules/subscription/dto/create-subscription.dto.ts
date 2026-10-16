import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from './../enum/paymentMethode.enum'

export class CreateSubscriptionDto {
  
  @ApiProperty({ description: 'ID of the provider' })
  @IsNotEmpty()
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'ID of the subscription plan to be applied' })
  @IsMongoId()
  planId: string;

  @ApiProperty({ description: 'Optional notes for the subscription', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}