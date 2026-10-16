import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { WeekDay } from 'src/common/enum/weekday.enum';

import { EmployeeWorkFor } from '../../../common/enum/employee-workfor.enum';
import { WorkingHours, WorkingHoursSchema } from '../../provider/schemas/working-day.schema';
import { BreakStatus } from 'src/common/enum/break-status.enum';
export interface EmployeeCapabilities {
  canLogin: boolean;
  canViewOwnBookings: boolean;
  canViewStatistics: boolean;
  canManageBreakTime: boolean;

}

export type EmployeeDocument = Employee & Document;

@Schema({ _id: false })
export class EmployeeService {
  @Prop({ type: Types.ObjectId, required: true })
  serviceItemId: Types.ObjectId;


  @Prop({ type: Date, default: Date.now })
  addedAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, required: false })
  updatedBy?: {
    _id: Types.ObjectId;
    name: string;
    role: string;
  };



  @Prop({ type: Date, required: false })
  updatedAt?: Date;
}

@Schema({
  timestamps: true,
  collection: 'employees',
})
export class Employee {
  /* ===== Relations ===== */

  @ApiProperty({ description: 'Service provider id' })
  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
    index: true,
  })
  providerId: Types.ObjectId;

  @ApiProperty({ description: 'Owner user id' })
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: EmployeeWorkFor, required: true, default: EmployeeWorkFor.BOTH })
  workFor: EmployeeWorkFor;
  /* ===== Basic Info ===== */

  @ApiProperty({ example: 'Ahmed Ali' })
  @Prop({ required: true, trim: true })
  name: string;

  
  @ApiPropertyOptional({
    description: 'Lookup Item ID (key = EMPLOYEE_POSITION)',
    example: '69795dd0c19f459a2862bad7',
  })
  @Prop({ type: Types.ObjectId, ref: 'Lookup', required: true })
  position?: Types.ObjectId;

  /* ===== Images ===== */
  @ApiPropertyOptional()
  @Prop()
  profileImage?: string;

  /* ===== Services Capability ===== */
  @ApiPropertyOptional({
    description: 'Service item IDs this employee can perform',
  })
  @Prop({
    type: [EmployeeService],
    default: [],
  })
  services?: EmployeeService[];



  /* ===== Capabilities ===== */

  @ApiPropertyOptional({

    description: 'Capabilities assigned to the employee',
  })
  @Prop({
    type: {
      canLogin: { type: Boolean, default: true },
      canViewOwnBookings: { type: Boolean, default: true },
      canViewStatistics: { type: Boolean, default: true },
      canManageBreakTime: { type: Boolean, default: true }
    },
    _id: false,
    default: {}
  })
  capabilities: EmployeeCapabilities;


  /* ===== Password ===== */

  // @ApiPropertyOptional()
  // @Prop()
  // password?: string;

  /* ===== Working Hours (Optional override) ===== */

@ApiPropertyOptional({
  description: 'Employee specific working hours (override provider)',
  example: {
    timezone: 'Asia/Riyadh',
    weekly: [
      { day: WeekDay.SUNDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: WeekDay.MONDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
    ],
    breaks: {
      // weekly: [
        
      // ],
      // custom: [
      //   { date: '2026-02-20', startTime: '13:00', endTime: '13:30', reason: 'holiday', status: BreakStatus.PENDING },
      // ]
    }
  }
})
@Prop({ type: WorkingHoursSchema })
workingHours?: WorkingHours;

@Prop({ default: true })
  isActive: boolean;
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: String, default: '' })
  deleteReason?: string;
}

export const EmployeeSchema =
  SchemaFactory.createForClass(Employee);

/* ===== Indexes ===== */
 