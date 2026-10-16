import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsMongoId, IsNumberString, IsDateString, IsString } from 'class-validator';
import { AppointmentStatus } from '../enum/appointmentstatus.enum';

export class GetAllAppointmentsAdminDto {

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'Limit per page', default: 20 })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Filter by providerId' })
  @IsOptional()
  @IsMongoId()
  providerId?: string;

  @ApiPropertyOptional({ description: 'Filter by customerId' })
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search by customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Search by provider / salon name' })
  @IsOptional()
  @IsString()
  providerName?: string;
}
