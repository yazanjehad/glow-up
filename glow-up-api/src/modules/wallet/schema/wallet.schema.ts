import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true, collection: 'wallets' })
export class WalletTransaction {
  @ApiProperty({
    example: 50,
    description: 'Amount of the transaction',
  })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({
    enum: ['CREDIT', 'DEBIT'],
    example: 'CREDIT',
    description: 'Type of transaction',
  })
  @Prop({ required: true, enum: ['CREDIT', 'DEBIT'] })
  type: 'CREDIT' | 'DEBIT';

  @ApiPropertyOptional({
    example: 'Wallet top-up',
    description: 'Transaction description',
  })
  @Prop()
  description?: string;

  @ApiProperty({
    type: String,
    example: '64b8e6b6f1c4c6d8c4d3e2a1',
    description: 'Reference to the user',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    default: Date.now,
  })
  createdAt: Date;

  @Prop({
    default: Date.now,
  })
  updatedAt: Date;
}


export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet {
  @ApiProperty({
    type: String,
    example: '64b8e6b6f1c4c6d8c4d3e2a1',
    description: 'Reference to the user',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @ApiProperty({
    example: 0,
    description: 'Current wallet balance',
  })
  @Prop({ type: Number, default: 0 })
  balance: number;

  @ApiPropertyOptional({
    type: [WalletTransaction],
    description: 'Transaction history',
  })
  @Prop({ type: [WalletTransactionSchema], default: [] })
  transactions: WalletTransaction[];
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexing for faster queries
