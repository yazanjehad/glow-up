import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { RatingType } from '../../../common/enum/RatingType.enum';

export type RatingDocument = Rating &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true, collection: 'ratings' })
export class Rating {
  @ApiProperty()
  @Prop({
    type: Types.ObjectId,
    ref: 'Appointment',
    required: true,

  })
  appointmentId: Types.ObjectId;

  @ApiProperty()
  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
    index: true,
  })
  providerId: Types.ObjectId;


  @Prop({ type: Types.ObjectId, ref: 'Employee', required: false, index: true }) 
  employeeId?: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Prop({ min: 1, max: 5, required: true })
  rating: number;

  @ApiProperty({ required: false })
  @Prop()
  comment?: string;

  @ApiProperty({ default: false })
  @Prop({ default: false })
  isDeleted: boolean;

   @Prop({ type: String, enum: RatingType, required: true })
  type: RatingType;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
