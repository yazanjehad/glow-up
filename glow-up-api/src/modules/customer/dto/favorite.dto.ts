import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class FavoriteDto {
  @ApiProperty({
    example: '696cf725e06249571505c9a2',
    description: 'ID of provider',
  })
  @IsNotEmpty({ message: 'common.errors.PROVIDER_ID_REQUIRED' })
  @IsMongoId()
  providerId: string;
}
