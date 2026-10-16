import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentServiceDto } from './create-appointment.dto';
import { AppointmentBookingType } from '../enum/appointmentType.enum';

export class ProviderCreateAppointmentDto {

  @ApiPropertyOptional({
    description: 'Customer user id if registered',
    example: '65f1c2a8e8f1d23bfc9d1111'
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    type: [AppointmentServiceDto],
    description: 'List of services to book'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceDto)
  services: AppointmentServiceDto[];

  @ApiProperty({
    description: 'Booking type: SELF or FOR_OTHER',
    enum: AppointmentBookingType,
    required: false
  })
  @IsOptional()
  @IsEnum(AppointmentBookingType)
  bookingType?: AppointmentBookingType;

  @ApiPropertyOptional({
    description: 'Indicates if this is an external customer (not registered)',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isExternalCustomer?: boolean;

  @ApiPropertyOptional({
    description: 'Name of external customer (required if isExternalCustomer=true)',
    example: 'Mohammad'
  })
  @IsOptional()
  @IsString()
  externalName?: string;

  @ApiPropertyOptional({
    description: 'Phone number of external customer (required if isExternalCustomer=true)',
    example: '0555555555'
  })
  @IsOptional()
  @IsString()
  externalPhone?: string;
}