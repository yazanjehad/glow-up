import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../enum/appointmentstatus.enum';
import { AppointmentSource } from '../enum/appointmentsource.enum';

class TimeSlotDto {
  @ApiProperty({ example: '12:00' })
  start: string;

  @ApiProperty({ example: '13:00' })
  end: string;
}

class AppointmentServiceSnapshotDto {
  @ApiProperty({ example: 'HAIRCUT' })
  name: string;

  @ApiProperty({ example: 50 })
  price: number;

  @ApiProperty({ example: 60 })
  durationMinutes: number;
}

class AppointmentPriceDto {
  @ApiProperty({ example: 80 })
  servicesTotal: number;

  @ApiProperty({ example: 0 })
  discount?: number;

  @ApiProperty({ example: 80 })
  finalTotal: number;
}

class AppointmentCancellationDto {
  @ApiProperty({ example: 'CUSTOMER' })
  cancelledBy: string;

  @ApiProperty({ example: 'Changed my mind' })
  reason?: string;

  @ApiProperty({ example: '2026-02-10T11:00:00.000Z' })
  cancelledAt?: Date;
}

export class AppointmentResponseDto {
  @ApiProperty({ example: 'Glow Beauty Center' })
  providerName: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiPropertyOptional({ example: 'Ahmed Al-Khatib' })
  employeeName?: string;
    @ApiProperty({
      example: '2026-02-10',
      description: 'Appointment date (UTC)',
    })
    date: Date;

  @ApiProperty({ type: TimeSlotDto })
  timeSlot: TimeSlotDto;

  @ApiProperty({ example: 90 })
  totalDurationMinutes: number;

  @ApiProperty({ type: [AppointmentServiceSnapshotDto] })
  services: AppointmentServiceSnapshotDto[];

  @ApiProperty({ type: AppointmentPriceDto })
  price: AppointmentPriceDto;

  @ApiProperty({ enum: AppointmentStatus })
  status: AppointmentStatus;

  @ApiPropertyOptional({ type: AppointmentCancellationDto })
  cancellation?: AppointmentCancellationDto;

  @ApiProperty({ enum: AppointmentSource })
  source: AppointmentSource;

  @ApiPropertyOptional({ example: 'First visit' })
  customerNote?: string;
}
