import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

import { AppointmentStatus } from '../enum/appointmentstatus.enum';
import { AppointmentSource } from '../enum/appointmentsource.enum';
import { AppointmentBookingType } from '../enum/appointmentType.enum';

/* ======================================================
   SUB SCHEMAS
   ====================================================== */

@Schema({ _id: false })
export class TimeSlot {
  @Prop({ required: true })
  start: string; // HH:mm

  @Prop({ required: true })
  end: string; // HH:mm
}
const TimeSlotSchema = SchemaFactory.createForClass(TimeSlot);

@Schema({ _id: false })
export class AppointmentServiceSnapshot {

  @Prop({ type: Types.ObjectId,
     comment: 'ProviderServiceItem._id reference (embedded document)',
     description: 'Reference to the service item at the time of booking'
   })
  serviceItemId?: Types.ObjectId;

  @ApiPropertyOptional({
    example: "65f1c2a8e8f1d23bfc9d1111",
    description: "Employee ID assigned to this service (optional)"
  })
 @Prop({ type: Types.ObjectId, ref: 'Employee' ,
      comment: 'Employee assigned to this service (optional)',
 })
  employeeId?: Types.ObjectId;

  @ApiProperty({ example: 1 , description: 'Number of customers for this specific service (for group bookings)' })
  @Prop({
    default: 1,
    min: 1,
  })
  numberOfCustomers: number;

  @ApiProperty({
  example: '2026-02-10',
  description: 'Service date (UTC) - in case service date differs from appointment date',
})
@Prop({
  required: true,
})
date: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'If true → system assigns any available employee',
  })
  @Prop({
    default: false,
  })
  anyEmployee?: boolean;

  @ApiProperty({
    example: { start: '10:00', end: '11:30' },
    description: 'Time slot for this specific service (can differ from overall appointment time)',
  })
  @Prop({ type: TimeSlotSchema, required: true ,
    description: 'Time slot for this specific service (can differ from overall appointment time)'
  })
  timeSlot: TimeSlot;


  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  durationMinutes: number;


  @Prop({ type: Types.ObjectId, ref: 'UserPackage', default: null })
  usedUserPackageId?: Types.ObjectId;

  @Prop({ default: 0 })
  packageDiscountApplied?: number;

}
const AppointmentServiceSnapshotSchema =
  SchemaFactory.createForClass(AppointmentServiceSnapshot);

@Schema({ _id: false })
class AppointmentPrice {
  @Prop({ required: true })
  servicesTotal: number;

  @Prop({ default: 0 })
  discount?: number;

  @Prop({ required: true })
  finalTotal: number;
}
const AppointmentPriceSchema =
  SchemaFactory.createForClass(AppointmentPrice);

@Schema({ _id: false })
class AppointmentCancellation {
  @Prop()
  cancelledBy?: string; // CUSTOMER | PROVIDER | ADMIN | SYSTEM

  @Prop()
  reason?: string;

  @Prop()
  cancelledAt?: Date;
}
const AppointmentCancellationSchema =
  SchemaFactory.createForClass(AppointmentCancellation);

/* ======================================================
   MAIN SCHEMA
   ====================================================== */

export type AppointmentDocument = Appointment & Document;

@Schema({
  timestamps: true,
  collection: 'appointments',
})
export class Appointment {
  /* ===== Relations ===== */

  @ApiProperty({ description: 'Service provider id' })
  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
    index: true,
  })
  providerId: Types.ObjectId;

  @ApiProperty({ description: 'Customer user id' })
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    index: true,
    default: null,
  })
  customerId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Indicates if a reminder notification has been sent' })
  @Prop({ default: false })
  reminderSent: boolean;

//   @ApiPropertyOptional({ description: '' })
//   @Prop({ default: 1,
//       comment: 'Number of customers for this appointment (for group bookings)',
//       description: 'Number of customers for this appointment (for group bookings)'
//    })
// numberOfCustomers: number;

  // @ApiPropertyOptional({ description: 'Assigned employee id' })
  // @Prop({ type: Types.ObjectId, ref: 'Employee' })
  // employeeId?: Types.ObjectId;

  /* ===== Date & Time ===== */

  // @ApiProperty({
  //   example: '2026-02-10',
  //   description: 'Appointment date (UTC)',
  // })
  // @Prop({ required: true, index: true })
  // date: Date;

  // @ApiProperty({
  //   example: { start: '10:00', end: '11:30' },
  // })
  // @Prop({ type: TimeSlotSchema, required: true })
  // timeSlot: TimeSlot;

  @ApiProperty({
    example: 90,
    description: 'Total duration in minutes',
  })
  @Prop({ required: true })
  totalDurationMinutes: number;

  /* ===== Services Snapshot ===== */

  @ApiProperty({ type: [AppointmentServiceSnapshot] })
  @Prop({
    type: [AppointmentServiceSnapshotSchema],
    required: true,
  })
  services: AppointmentServiceSnapshot[];

  /* ===== Pricing Snapshot ===== */

  @ApiProperty()
  @Prop({
    type: AppointmentPriceSchema,
    required: true,
  })
  price: AppointmentPrice;

  /* ===== Status ===== */

  @ApiProperty({ enum: AppointmentStatus })
  @Prop({
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
    index: true,
  })
  status: AppointmentStatus;

  /* ===== Cancellation ===== */

  @ApiPropertyOptional()
  @Prop({ type: AppointmentCancellationSchema })
  cancellation?: AppointmentCancellation;

  /* ===== Meta ===== */

  @ApiProperty({ enum: AppointmentSource })
  @Prop({
    enum: AppointmentSource,
    default: AppointmentSource.WEB,
  })
  source: AppointmentSource;

  @ApiProperty({
  enum: AppointmentBookingType,
  default: AppointmentBookingType.SELF,
  description: 'Booking type: self or for someone else',
})
@Prop({
  enum: AppointmentBookingType,
  default: AppointmentBookingType.SELF,
})
bookingType: AppointmentBookingType;

 @ApiPropertyOptional()
@Prop({ default: null })
couponCode?: string;
  @Prop()
  customerNote?: string;

  /* ===== External Customer Support ===== */
  @ApiPropertyOptional({
    description: 'If true → appointment booked for non-registered external customer',
  })
  @Prop({
    default: false,
    index: true,
  })
  isExternalCustomer: boolean;

  @ApiPropertyOptional({
    description: 'External customer name (required if isExternalCustomer = true)',
  })
  @Prop({ default: null })
  externalCustomerName?: string;

  @ApiPropertyOptional({
    description: 'External customer phone (required if isExternalCustomer = true)',
  })
  @Prop({ default: null })
  externalCustomerPhone?: string;

  @ApiPropertyOptional()
  @Prop()
  internalNote?: string;

  @ApiPropertyOptional()
  @Prop({
    default: null,
  })
  completedBy?: Types.ObjectId;

  @ApiPropertyOptional()
  @Prop({
    default: null,
  })
  completedAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

/* ======================================================
   SCHEMA FACTORY & INDEXES
   ====================================================== */

export const AppointmentSchema =
  SchemaFactory.createForClass(Appointment);

/* ===== Indexes ===== */

AppointmentSchema.index({ providerId: 1, customerId: 1 });
AppointmentSchema.index({
  providerId: 1,
  'services.date': 1,
  'services.timeSlot.start': 1,
  'services.timeSlot.end': 1,
});
AppointmentSchema.index({
  providerId: 1,
  'services.employeeId': 1,
  status: 1,
});

AppointmentSchema.index({ status: 1, reminderSent: 1, 'services.date': 1 });
