
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FavoriteProviderResponseDto {
  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d9' })
  id?: string;

  @ApiPropertyOptional({ example: 'Salon X' })
  name?: string;


  @ApiPropertyOptional({ example: { average: 3.7, count: 3 } })
  rating?: { average: number; count: number };

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  address?: string;
  @ApiPropertyOptional()
  coverImage?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  genderType?: string;
}

// endpoint return Array directly
export type GetCustomerFavoritesResponseDto = FavoriteProviderResponseDto[];
