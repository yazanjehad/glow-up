import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetSlotsDto {
  @ApiProperty({ example: '2026-02-02' })
  @IsNotEmpty({ message: 'common.errors.DATE_REQUIRED' })
  @IsDateString({}, { message: 'common.errors.DATE_INVALID' })
  date: string;

  @ApiProperty({ example: '64f8c9b6d3e2c123456789ab' })
  @IsNotEmpty({ message: 'common.errors.SERVICE_ID_REQUIRED' })
  @IsMongoId({ message: 'common.errors.SERVICE_ID_INVALID' })
  serviceId: string;

  @ApiPropertyOptional({ example: '64f8c9b6d3e2c123456789ab' })
  @IsOptional()
  @IsString()
  employeeId?: string;


  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  numberOfCustomers?: number;
}
