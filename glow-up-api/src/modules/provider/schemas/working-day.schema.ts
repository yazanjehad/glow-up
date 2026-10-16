import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BreakStatus } from "src/common/enum/break-status.enum";
import { WeekDay } from "src/common/enum/weekday.enum";

@Schema({ _id: false })
export class WorkingDay {
  @Prop({ required: true, enum: WeekDay })
  day: WeekDay;

  @Prop({ required: true })
  isOpen: boolean;

  @Prop()
  openTime?: string;

  @Prop()
  closeTime?: string;
}

export const WorkingDaySchema =
  SchemaFactory.createForClass(WorkingDay);

@Schema({ _id: false })
export class WorkingHourException {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  isOpen: boolean;

  @Prop()
  openTime?: string;

  @Prop()
  closeTime?: string;

  @Prop()
  reason?: string;
}

export const WorkingHourExceptionSchema =
  SchemaFactory.createForClass(WorkingHourException);

/* ===== Break Schemas ===== */

@Schema({timestamps: true})
export class BreakWeekly {

  @Prop()
  _id?: Types.ObjectId;

  @Prop({ required: true, enum: WeekDay })
  day: WeekDay;

  // common.errors.BREAK_MUST_HAVE_START_END
  @Prop({ required: true })
  startTime: string;

    // common.errors.BREAK_MUST_HAVE_START_END
  @Prop({ required: true })
  endTime: string;

  @Prop()
  reason?: string;
}

export const BreakWeeklySchema = SchemaFactory.createForClass(BreakWeekly);

@Schema({timestamps: true})
export class BreakCustom {
  @Prop()
  _id?: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop()
  reason?: string;

    @Prop({
    type: String,
    enum: BreakStatus,
    default: BreakStatus.PENDING,
  })
  status: BreakStatus;

  
}

export const BreakCustomSchema = SchemaFactory.createForClass(BreakCustom);

/* ===== Working Breaks Container ===== */

@Schema({ _id: false })
export class WorkingBreaks {
  @Prop({ type: [BreakWeeklySchema], default: [] })
  weekly: BreakWeekly[];

  @Prop({ type: [BreakCustomSchema], default: [] })
  custom: BreakCustom[];
}

export const WorkingBreaksSchema = SchemaFactory.createForClass(WorkingBreaks);

/* ===== Main Working Hours with Breaks ===== */

@Schema({ _id: false })
export class WorkingHours {
  @Prop({ default: 'Asia/Riyadh'})
  timezone: string;

  @Prop({ type: [WorkingDaySchema], default: [] })
  weekly: WorkingDay[];

  @Prop({ type: [WorkingHourExceptionSchema], default: [] })
  exceptions?: WorkingHourException[];

  @Prop({ type: WorkingBreaksSchema })
  breaks?: WorkingBreaks;
}

export const WorkingHoursSchema =
  SchemaFactory.createForClass(WorkingHours);
