import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GenderType } from 'src/common/enum/gendertype.enum';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum'; // assuming this is the right enum import

export class ProviderResponseDto {

  @ApiProperty({
    description: 'Provider id',
    example: '0000000',
  })
  @IsString()
  _id?: string;


  @ApiProperty({
    description: 'Provider name',
    example: 'Salon XYZ',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'user ID',
    example: '65123456789abcdef12345',
  })
   userId: string;

  @ApiProperty({
    description: 'Gender type of the provider',
    enum: GenderType,
    example: GenderType.MALE,
  })
  @IsEnum(GenderType)
  genderType?: GenderType;

  @ApiProperty({
    description: 'Provider status',
    enum: ProviderStatus,
    example: ProviderStatus.PENDING,
  })
  @IsEnum(ProviderStatus)
  status: ProviderStatus;

  @ApiProperty({
    description: 'Provider phone number',
    example: '0790000000',
  })
  @IsString()
  phone: string;

  @ApiPropertyOptional({
    description: 'address of the provider',
    example: 'Nablus',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Rating of the provider',
    example: 4.5,
  })
  rating: number;

  @ApiProperty({
    description: 'Number of reviews for the provider',
    example: 120,
  })
  reviewCount: number;

//   @ApiProperty({
//     description: 'Created date of the provider profile',
//     example: '2022-01-01T10:30:00.000Z',
//   })
//   createdAt: Date;

//   @ApiProperty({
//     description: 'Updated date of the provider profile',
//     example: '2022-01-02T12:45:00.000Z',
//   })
//   updatedAt: Date;

}
