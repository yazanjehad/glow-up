import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

// refresh-token.schema.ts
@Schema({ timestamps: true })
export class RefreshToken {

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  revoked: boolean;
}

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ userId: 1, token: 1, revoked: 1 });
RefreshTokenSchema.index({ userId: 1 , revoked: 1});
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
