import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { RoleType } from '../../../common/enum/roletype.enum';
import { UserStatus } from '../enum/userstatus.enum';
import { GenderType } from '../../../common/enum/gendertype.enum';
import { IsEnum, IsOptional } from 'class-validator';
import { PermissionType } from 'src/common/enum/permission.enum';



export type UserDocument = User & Document;



@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique email address',
  })
  @Prop({
    lowercase: true,
    trim: true,
  })
  email?: string;

  @ApiPropertyOptional({
    example: '+970599000000',
    description: 'User phone number',
  })
  @Prop({
    unique: true,
    required: true,
    trim: true,
  })
  phone: string;




  @ApiProperty({
    example: '$2b$10$hashedPassword',
    description: 'Hashed user password',
  })
  @Prop()
  passwordHash?: string;



    @ApiProperty({
    enum: RoleType,
    example: RoleType.CUSTOMER,
    description: 'User role',
  })
  @Prop({
    type: String,
    enum: RoleType,
    default: RoleType.CUSTOMER,
    required: true,
  })
  role: RoleType;

  @ApiPropertyOptional({
    example: ['appointment.cancel_any', 'provider.manage_employees'],
    description: 'Fine-grained permissions (optional)',
  })
  @Prop({
    type: [String],
    default: [],
  })
  permissions?: PermissionType[];

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'User account status',
  })
  @Prop({
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiPropertyOptional({
    example: '2026-01-10T10:30:00.000Z',
    description: 'Last login timestamp',
  })
  @Prop()
  lastLoginAt?: Date;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/customers/avatar.png',
    description: 'Customer profile image URL',
  })
  @Prop()
  profileImage?: string;


  @Prop({ type: [String], default: [] })
  fcmTokens: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: String, default: '' })
  deleteReason?: string;

}



export const UserSchema = SchemaFactory.createForClass(User);



UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $type: 'string' },
    },
  },
);


UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
