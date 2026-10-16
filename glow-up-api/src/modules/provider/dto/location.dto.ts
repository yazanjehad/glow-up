import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiPropertyOptional({description: 'Latitude between -90 and 90 degrees'})
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({description: 'Longitude between -180 and 180 degrees', })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
