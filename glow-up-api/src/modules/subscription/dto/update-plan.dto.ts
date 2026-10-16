import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Updated name of the subscription plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated price of the subscription plan' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Updated duration of the plan in days' })
  @IsOptional()
  @IsNumber()
  durationDays?: number;

  @ApiPropertyOptional({ description: 'Updated commission percentage for this plan' })
  @IsOptional()
  @IsNumber()
  commissionPercent?: number;

  @ApiPropertyOptional({ description: 'Updated status of the plan (active or inactive)' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}