import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LookupDocument = Lookup & Document;

@Schema({ timestamps: true, collection: 'lookups' })
export class Lookup {
  @Prop({ required: true, uppercase: true, trim: true })
  key: string; // PROVIDER_TYPE

  @Prop({ required: true, uppercase: true, trim: true })
  code: string; // SALOON

  @Prop({
    type: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    required: true,
  })
  name: {
    en: string;
    ar: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const LookupSchema = SchemaFactory.createForClass(Lookup);

// Indexes
LookupSchema.index({ key: 1, code: 1 }, { unique: true });
LookupSchema.index({ key: 1, isActive: 1, order: 1 });
