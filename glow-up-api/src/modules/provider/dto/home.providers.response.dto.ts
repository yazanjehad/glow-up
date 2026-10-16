import { ApiProperty } from '@nestjs/swagger';
import { ProviderResponseDto } from './provider-response.dto';

export class HomeProvidersResponseDto {
  @ApiProperty({ type: [ProviderResponseDto] })
  newest: ProviderResponseDto[];

  @ApiProperty({ type: [ProviderResponseDto] })
  topRated: ProviderResponseDto[];

  @ApiProperty({ type: [ProviderResponseDto] })
  nearest: ProviderResponseDto[];
}