import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsEnum, 
  IsMongoId, 
  IsNumber, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from 'class-validator';

class PaymentItemDto {
  @IsString()
  serviceId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  durationMinutes: number;
}

class PaymentAmountDto {
  @IsNumber()
  subtotal: number;

  @IsNumber()
  discount: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  total: number;
}

export class CreatePaymentDto {
  @IsMongoId()
  customerId: string;

  @IsOptional()
  couponId?: string;

  @IsMongoId()
  @IsOptional()
  appointmentId?: string;

  @IsMongoId()
  providerId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];

  @ValidateNested()
  @Type(() => PaymentAmountDto)
  amount: PaymentAmountDto;

  @IsEnum(['CASH', 'CARD', 'ONLINE'])
  @IsOptional()
  method?: string; // Default: CASH

  @IsEnum(['PENDING', 'PAID', 'FAILED', 'REFUNDED'])
  @IsOptional()
  status?: string; // Default: PENDING
  
  @IsString()
  @IsOptional()
  transactionRef?: string;

  @IsOptional()
  @IsMongoId()
  packageId?: string;
}