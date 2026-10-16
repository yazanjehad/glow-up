import { ApiProperty } from '@nestjs/swagger';

export class UserPackageItemResponseDto {
  @ApiProperty()
  serviceItemId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  remaining: number;
}


