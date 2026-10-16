import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { AdStatus } from '../../../common/enum/adsstatus.enum';


@Schema({ timestamps: true })
export class Ad extends Document {
  @ApiProperty({ description: 'title of ads' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: 'description of ads' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'banner image of ads' })
  @Prop({ required: true })
  banner: string;

  @ApiProperty({ description: 'link_to saloon' })
  @Prop()
  link_to?: string;

  @ApiProperty({ description: 'provider ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  providerId?: Types.ObjectId;

  @ApiProperty({ enum: AdStatus, default: AdStatus.PENDING })
  @Prop({ type: String, enum: AdStatus, default: AdStatus.PENDING })
  status: AdStatus;

  @Prop({ default: false })
  isDeleted: boolean;

 
}

export const AdSchema = SchemaFactory.createForClass(Ad);
