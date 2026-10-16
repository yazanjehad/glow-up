import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { UserPackageStatus } from '../../../common/enum/userpackegestatus.enum';

/* ===============================
   SUB DOCUMENT (Package Items)
================================= */

@Schema({ _id: false })
export class UserPackageItem {
  @Prop({ type: Types.ObjectId, required: true })
  serviceItemId: Types.ObjectId;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true })
  remaining: number;
}

export const UserPackageItemSchema =
  SchemaFactory.createForClass(UserPackageItem);

/* ===============================
   MAIN SCHEMA
================================= */

@Schema({ timestamps: true })
export class UserPackage {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'ServiceProvider',
    required: true,
  })
  providerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    required: true,
  })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  packageName: string;

  @Prop({ required: true })
  price: number;

  @Prop({
    type: [UserPackageItemSchema],
    required: true,
  })
  items: UserPackageItem[];

  @Prop({
    type: String,
    enum: UserPackageStatus,
    default: UserPackageStatus.ACTIVE,
  })
  status: UserPackageStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'Payment',
    required: true,
    unique: true,
  })
  paymentId: Types.ObjectId;

  @Prop({
    default: Date.now,
  })
  purchasedAt: Date;
}

export type UserPackageDocument = Document & UserPackage & {
  _id: Types.ObjectId;
};
export const UserPackageSchema = SchemaFactory.createForClass(UserPackage);

UserPackageSchema.index(
  { userId: 1, packageId: 1, status: 1 },
);
