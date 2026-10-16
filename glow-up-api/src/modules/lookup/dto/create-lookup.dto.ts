import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LookupNameDto {
  @ApiProperty({
    example: 'Salon',
    description: 'English display name',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.LOOKUP_NAME_EN_REQUIRED' })
  en: string;

  @ApiProperty({
    example: 'صالون',
    description: 'Arabic display name',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.LOOKUP_NAME_AR_REQUIRED' })
  ar: string;
}

export class CreateLookupDto {
  @ApiProperty({
    example: 'PROVIDER_TYPE',
    description: 'Lookup group key (uppercase letters and underscore only)',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.LOOKUP_KEY_REQUIRED' })
  @Matches(/^[A-Z_]+$/, {
    message: 'key must contain only uppercase letters and underscores (A-Z, _)',
  })
  key: string;

  @ApiProperty({
    example: 'SALOON',
    description: 'Lookup item code (uppercase letters and underscore only)',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.LOOKUP_CODE_REQUIRED' })
  @Matches(/^[A-Z_]+$/, {
    message:
      'code must contain only uppercase letters and underscores (A-Z, _)',
  })
  code: string;

  @ApiProperty({
    type: LookupNameDto,
    description: 'Localized lookup name',
  })
  @ValidateNested()
  @Type(() => LookupNameDto)
  name: LookupNameDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the lookup item is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Ordering index (lower comes first)',
  })
  @IsOptional()
  @IsNumber()
  order?: number;
}
