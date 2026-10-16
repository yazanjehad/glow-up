import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBooleanString, IsNumberString } from 'class-validator';

export class GetLookupsFilterDto {
@ApiPropertyOptional({
  description:
    'Filter by lookup key (PROVIDER_TYPE, SERVICE_TYPE, SERVICE_CATEGORY, EMPLOYEE_POSITION) (optional)',
})
@IsOptional()
@IsString()
key?: string;

@ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
