import { PartialType } from '@nestjs/mapped-types';
import { AppointmentCancellationDto, CreateAppointmentDto, AppointmentServiceDto } from './create-appointment.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {

  @ApiPropertyOptional({
    type: [AppointmentServiceDto],
    description: 'List of services to update (optional)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceDto)
  services?: AppointmentServiceDto[];

  @ApiPropertyOptional({
    example: 'Please be on time',
  })
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiPropertyOptional({
    type: AppointmentCancellationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppointmentCancellationDto)
  cancellation?: AppointmentCancellationDto;
}
