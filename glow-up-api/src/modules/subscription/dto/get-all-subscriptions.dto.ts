import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscripionStatus } from 'src/common/enum/subscriptionStatus.enum';

export class GetAllSubscriptionsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({ example: '67d111111111111111111111' })
  @IsOptional()
  @IsMongoId()
  providerId?: string;

  @ApiPropertyOptional({
    enum: SubscripionStatus,
    example: SubscripionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SubscripionStatus)
  status?: SubscripionStatus;

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Filter subscriptions created from this date',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    example: '2026-03-31',
    description: 'Filter subscriptions created until this date',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort field',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}