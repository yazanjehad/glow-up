import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ _id: true })
export class GalleryItem {
  @Prop({ required: true })
  blobPath: string;

  @Prop({ required: true })
  filename: string;
   @Prop({ required: true })
  type: string;
  @Prop({ default: Date.now })
  uploadedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;
}
