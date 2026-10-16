import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanType } from 'src/common/enum/planType.enum';

export class CreatePlanDto {
  @ApiProperty({ description: 'Name of the subscription plan' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Price of the subscription plan' })
  @IsNumber()
  price: number;

@ApiProperty({
  description: 'Type of the plan',
  enum: PlanType,
  enumName: 'PlanType',
})
@IsEnum(PlanType)
type: PlanType;

  @ApiProperty({ description: 'Duration of the plan in days' })
  @IsNumber()
  durationDays: number;

  @ApiPropertyOptional({ description: 'Commission percentage for this plan' })
  @IsNumber()
  @IsOptional()
  commissionPercent?: number;

  @ApiPropertyOptional({ description: 'Whether the plan is active or not' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}