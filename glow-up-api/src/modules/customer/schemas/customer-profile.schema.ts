import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { ServiceProvider } from '../../provider/schemas/service-provider.schema';
import { CustomerGender, GenderType } from 'src/common/enum/gendertype.enum';

export type CustomerProfileDocument = CustomerProfile & Document;

@Schema({
  timestamps: true,
  collection: 'customer_profiles',
})
export class CustomerProfile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId: Types.ObjectId;


  @Prop({ enum: CustomerGender })
  gender?: CustomerGender;


  @Prop({ type: Date })
  birthDate?: Date;


  @Prop()
  firstname: string;

  @Prop()
  lastname: string;

  @Prop()
  avatar?: string;
  @Prop()
  profileImage?: string;
  // @Prop()
  // city?: string;


  @Prop()
  address?: string;


  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
  
  @Prop({
    type: [{ type: Types.ObjectId, ref: ServiceProvider.name }],
    default: [],
  })
  favorites: Types.ObjectId[];
  createdAt?: Date;


  updatedAt?: Date;
}

export const CustomerProfileSchema =
  SchemaFactory.createForClass(CustomerProfile);
