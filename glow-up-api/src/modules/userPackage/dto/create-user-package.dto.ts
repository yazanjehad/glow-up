import { IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from 'src/modules/appointment/enum/paymenttype.enum';

export class CreateUserPackageDto {
  @ApiProperty({ example: '64f1c2a8e8f1d23bfc9d8888', description: 'ID of the Service Provider' })
  @IsMongoId()
  providerId: string;

  @ApiProperty({ example: '64f1c2a8e8f1d23bfc9d7777', description: 'ID of the Package to purchase' })
  @IsMongoId()
  packageId: string;

   @ApiPropertyOptional({
    example: 'VISA',
    description: 'Payment method for purchasing the package (VISA or WALLET)',
    enum: PaymentType
  })
  @IsEnum(PaymentType)
  paymentMethod?: PaymentType = PaymentType.VISA;
}

