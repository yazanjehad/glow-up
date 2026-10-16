import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { AppointmentBookingType } from '../enum/appointmentType.enum';
import { PaymentType } from '../enum/paymenttype.enum';

/* ======================================================
   Time Slot DTO
   ====================================================== */

export class TimeSlotDto {
  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({ example: '11:30' })
  @IsString()
  @IsNotEmpty()
  end: string;
}

/* ======================================================
   Service DTO (Inside services array)
   ====================================================== */

export class AppointmentServiceDto {
  @ApiProperty({
    example: '65f1c2a8e8f1d23bfc9d1111',
    description: 'Provider Service Item ID',
  })
  @IsMongoId()
  serviceItemId: string;

    @ApiProperty({
    example: '2026-02-10',
    description: 'Service date (YYYY-MM-DD)',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: '65f1c2a8e8f1d23bfc9d2222',
    description: 'Employee ID assigned to this service',
  })
  @IsOptional()
  @IsMongoId()
  employeeId?: string;

 @ApiPropertyOptional({
    example: true,
    description: 'If true system will assign any available employee',
  })
  @IsOptional()
  @IsBoolean()
  anyEmployee?: boolean;


  @ApiProperty({
    example: 1,
    description: 'Number of customers for this service',
  })
  @IsNumber()
  @Min(1)
  numberOfCustomers: number;

  @ApiProperty({
    type: TimeSlotDto,
    description: 'Time slot for this service',
  })
  @ValidateNested()
  @Type(() => TimeSlotDto)
  timeSlot: TimeSlotDto;

  /* ===== NEW: User Package ===== */
  @ApiPropertyOptional({
    example: '698c4de31ee3d52768ebf42a',
    description: 'User Package ID to apply for this service (optional)',
  })
  @IsOptional()
  @IsMongoId()
  userPackageId?: string;
}

/* ======================================================
   Cancellation DTO (Optional)
   ====================================================== */

export class AppointmentCancellationDto {
  @ApiPropertyOptional({
    example: 'CUSTOMER',
    description: 'Who cancelled the appointment',
  })
  @IsOptional()
  @IsString()
  cancelledBy?: string;

  @ApiPropertyOptional({
    example: 'Changed my mind',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    example: '2026-02-10T11:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  cancelledAt?: Date;
}

/* ======================================================
   MAIN CREATE DTO
   ====================================================== */

export class CreateAppointmentDto {
  @ApiProperty({
    example: '65f1c2a8e8f1d23bfc9d0000',
    description: 'Service Provider ID',
  })
  @IsMongoId()
  providerId: string;

  // @ApiProperty({
  //   example: '2026-02-10',
  //   description: 'Appointment date (YYYY-MM-DD)',
  // })
  // @IsDateString()
  // date: string;

  @ApiProperty({
    type: [AppointmentServiceDto],
    description: 'List of services included in this appointment',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppointmentServiceDto)
  services: AppointmentServiceDto[];



  @ApiPropertyOptional({
    enum: AppointmentBookingType,
    default: AppointmentBookingType.SELF,
  })
  @IsOptional()
  @IsEnum(AppointmentBookingType)
  bookingType?: AppointmentBookingType;

   @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({
    enum: PaymentType,
    example: PaymentType.CASH,
  })
  @IsEnum(PaymentType)
  @IsOptional()
  paymentMethod?: PaymentType = PaymentType.CASH;

  @ApiPropertyOptional({
    description: 'Indicates if this is an external customer (not registered)',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isExternalCustomer?: boolean;

  @ApiPropertyOptional({
    description: 'External customer name',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  externalName?: string;

  @ApiPropertyOptional({
    description: 'External customer phone',
    example: '0555555555'
  })
  @IsOptional()
  @IsString()
  externalPhone?: string;
}