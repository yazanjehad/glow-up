import { ApiProperty } from '@nestjs/swagger';

class LookupNameResponseDto {
  @ApiProperty({
    example: 'Salon',
    description: 'English display name',
  })
  en: string;

  @ApiProperty({
    example: 'صالون',
    description: 'Arabic display name',
  })
  ar: string;
}

export class LookupResponseDto {
  @ApiProperty({
    example: '65fcb1a2c8e4d123456789ab',
    description: 'Lookup unique identifier',
  })
  id: string;

  @ApiProperty({
    example: 'PROVIDER_TYPE',
    description: 'Lookup group key',
  })
  key: string;

  @ApiProperty({
    example: 'SALOON',
    description: 'Lookup code',
  })
  code: string;

  @ApiProperty({
    type: LookupNameResponseDto,
    description: 'Localized lookup name',
  })
  name: LookupNameResponseDto;

  @ApiProperty({
    example: true,
    description: 'Indicates whether this lookup is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 1,
    description: 'Order index used for sorting',
  })
  order: number;
}
