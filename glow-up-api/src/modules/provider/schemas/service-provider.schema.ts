import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

import { GenderType } from 'src/common/enum/gendertype.enum';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';
import { ProviderType } from 'src/common/enum/providertype.enum';

import {
  WorkingHours,
  WorkingHoursSchema,
} from './working-day.schema';
import { isNotEmpty, IsOptional } from 'class-validator';
import { ServiceLocation } from 'src/common/enum/service-location.enum';
import { WeekDay } from 'src/common/enum/weekday.enum';
import { appointmentStrategy } from 'src/common/enum/appointment-approve-strategy.enum';
import { BreakStatus } from 'src/common/enum/break-status.enum';

/* ======================================================
   SUB SCHEMAS
   ====================================================== */

/* 1. Service Item (Inside Category) */
@Schema() // Removed { _id: false } so Mongoose generates an ID automatically
export class ProviderServiceItem {
    // We explicitly define _id for TypeScript, though Mongoose handles it
  _id: Types.ObjectId;

   @Prop({ required: true })
   @ApiProperty({
    example: 'Basic haircut service',
    description: 'Service item name',
  })
  name: string;

   @ApiProperty({
    example: "65f1c2a8e8f1d23bfc9d1111",
    description: "Lookup Item ID (key = SERVICE_TYPE)"
  })
  @Prop({ type: Types.ObjectId, ref: 'Lookup', required: true })
  type: Types.ObjectId;

  @Prop()
  description?: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  durationMinutes: number;

  @Prop({ default: true })
  isActive: boolean;
}

const ProviderServiceItemSchema =
  SchemaFactory.createForClass(ProviderServiceItem);


/* 2. Service Category (New Wrapper) */
@Schema() // Generates _id automatically
export class ServiceCategory {
  _id: Types.ObjectId;

  @ApiProperty({
    example: '65f1c2a8e8f1d23bfc9d1111',
    description: 'Lookup Item ID (key = SERVICE_CATEGORY)',
  })
 @Prop({ type: Types.ObjectId, ref: 'Lookup', required: true })
  category: Types.ObjectId;

  @ApiProperty({ type: [ProviderServiceItem] })
  @Prop({ type: [ProviderServiceItemSchema], default: [] })
  items: ProviderServiceItem[];

}

const ServiceCategorySchema =
  SchemaFactory.createForClass(ServiceCategory);


/* 3. Rating (Unchanged) */
@Schema({ _id: false })
class ProviderRating {
  @Prop({ default: 0 })
  average: number;

  @Prop({ default: 0 })
  count: number;
}

const ProviderRatingSchema =
  SchemaFactory.createForClass(ProviderRating);

/* 4. Package Item */
@Schema({ _id: false })
export class PackageItem {
  @ApiProperty({ description: 'Service item ID' })
  @Prop({ type: Types.ObjectId, ref: 'ProviderServiceItem', required: true })
  serviceItemId: Types.ObjectId;

  @ApiProperty({ description: 'Quantity of this item', example: 1 })
  @Prop({ required: true })
  quantity: number;
}

export const PackageItemSchema = SchemaFactory.createForClass(PackageItem);

/* 5. Package */
@Schema()
export class Package {
  _id: Types.ObjectId;

  @ApiProperty({ example: 'Full Haircut Package' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: 'Includes haircut + shampoo + styling' })
  @Prop()
  desc?: string;

  @ApiProperty({ example: 50 })
  @Prop({ required: true })
  price: number;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ type: [PackageItem] })
  @Prop({ type: [PackageItemSchema], default: [] })
  items: PackageItem[];
}

export const PackageSchema = SchemaFactory.createForClass(Package);


/* ======================================================
   MAIN SCHEMA
   ====================================================== */

export type ServiceProviderDocument =
  ServiceProvider & Document;

@Schema({
  timestamps: true,
  collection: 'service_providers',
})
export class ServiceProvider {
  /* ===== Relations ===== */

  @ApiProperty({ description: 'Owner user id' })
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique:true
  })
  userId: Types.ObjectId;

  /* ===== Basic Info ===== */

  @ApiProperty({ example: 'Glow Beauty Center' })
  @Prop({ required: true, trim: true })
  name: string;

  


  @ApiPropertyOptional()
  @Prop()
  description?: string;

  // @ApiProperty({ enum: ProviderType })
  // @Prop({ enum: ProviderType })
  // type?: ProviderType;
  @ApiProperty({
  example: "65f1c2a8e8f1d23bfc9d1111",
  description: "Lookup Item ID (key = PROVIDER_TYPE)"
  })
  @Prop({type:Types.ObjectId, ref:'Lookup'})
  //optional
  @IsOptional()
  type?: Types.ObjectId;

  @ApiProperty({ enum: GenderType })
  @Prop({ enum: GenderType })
  genderType?: GenderType;

  /* ===== Status ===== */

  @ApiProperty({ enum: ProviderStatus })
  @Prop({
    enum: ProviderStatus,
    default: ProviderStatus.PENDING,
    index: true,
  })
  status: ProviderStatus;

  @ApiPropertyOptional()
  @Prop()
  rejectionReason?: string;

  /* ===== Contact ===== */


  @ApiProperty({ isArray: true })
  @Prop({ type: [String] })
  phones?: string[];

  /* ===== Service Location ===== */

  @ApiProperty({
    enum: ServiceLocation,
    example: ServiceLocation.BOTH,
    description: 'Where the service is provided: home, salon, or both',
  })
  @Prop({
    type: String,
    enum: ServiceLocation,

    default: ServiceLocation.SALON,
  })
  serviceLocation: ServiceLocation;


  /* ===== Address ===== */

  @ApiProperty()
  @Prop()
  address?: string;



  @ApiPropertyOptional()
  @Prop()
  postalCode?: string;

  /* ===== Location (simple & safe) ===== */

  @Prop({
    type: {
      type: String,
      enum: ['Point'],

    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
    },
  })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };


  /* ===== Images ===== */

  @ApiPropertyOptional()
  @Prop()
  logo?: string;

  @ApiPropertyOptional()
  @Prop()
  coverImage?: string;

  @ApiPropertyOptional({ isArray: true })
  @Prop({ type: [String], default: [] })
  gallery?: string[];


  @ApiPropertyOptional({ isArray: true })
  @Prop({ type: [String], default: [] })
  documents?: string[];

  /* ===== Services (Updated to Categories) ===== */

  @ApiPropertyOptional({ type: [ServiceCategory] })
  @Prop({
    type: [ServiceCategorySchema], // Changed to Category Schema
    default: [],
  })
  services: ServiceCategory[];

  /* ===== Working Hours ===== */

  @ApiPropertyOptional({description:"Working hours",
  example: {
    timezone: 'Asia/Riyadh',
    weekly: [
      { day: WeekDay.SUNDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: WeekDay.MONDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    ],
    breaks: {
      weekly: [
        { _id: '650f1c2a8e8f1d23bfc9d1111', day: WeekDay.MONDAY, startTime: '13:00', endTime: '13:30', reason: 'Lunch' },
        { _id: '650f1c2a8e8f1d23bfc9d1112', day: WeekDay.TUESDAY, startTime: '13:00', endTime: '13:30', reason: 'Lunch' }
      ],
      custom: [
        { _id: '650f1c2a8e8f1d23bfc9d1113', date: '2026-02-20', startTime: '13:00', endTime: '13:30', reason: 'holiday' ,status:BreakStatus.APPROVED},
      ]
    }
  }
  })
  @Prop({ type: WorkingHoursSchema })
  workingHours?: WorkingHours;

  /* ===== Rating ===== */

  @ApiPropertyOptional()
  @Prop({
    type: ProviderRatingSchema,
    default: () => ({}),
  })
  rating: ProviderRating;

  /* ===== Packages ===== */
  @ApiPropertyOptional({ type: [Package] })
  @Prop({ type: [PackageSchema], default: [] })
  packages?: Package[];

  /* =====  Appointment Strategy ===== */

@ApiPropertyOptional({ enum: appointmentStrategy ,example:"DIRECT"})
@Prop({
  type: String,
  enum: appointmentStrategy,
  default: appointmentStrategy.DIRECT,
})
appointmentStrategy?: appointmentStrategy;

@ApiPropertyOptional()
@Prop({ default: false })
isDeleted: boolean;
@ApiPropertyOptional()
@Prop({ type: Date, default: null })
deletedAt: Date | null;
@ApiPropertyOptional()
@Prop({ type: String, default: '' })
deleteReason?: string;
}

/* ================= SCHEMA FACTORY ================= */

export const ServiceProviderSchema =
  SchemaFactory.createForClass(ServiceProvider);


/* ================= INDEXES ================= */

ServiceProviderSchema.index({ status: 1, type: 1, address: 1 });
ServiceProviderSchema.index({ 'rating.average': -1 });
ServiceProviderSchema.index({ name: 'text', description: 'text' });
ServiceProviderSchema.index({ status: 1, createdAt: -1 });
ServiceProviderSchema.index({ location: "2dsphere" });
