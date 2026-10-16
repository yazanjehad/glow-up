import { ApiProperty } from '@nestjs/swagger';
import { ProviderResponseDto } from './provider-response.dto';

class MetaDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  lastPage: number;
}

export class PaginatedProviderResponseDto {
  @ApiProperty({ type: [ProviderResponseDto] })
  data: ProviderResponseDto[];

  @ApiProperty({ type: MetaDto })
  meta: MetaDto;
}