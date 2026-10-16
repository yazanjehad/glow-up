import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types, Document } from 'mongoose';

/* ================== ENUMS ================== */

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketUserRole {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum TicketCategory {
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  BOOKING_ISSUE = 'BOOKING_ISSUE',
  ACCOUNT_ISSUE = 'ACCOUNT_ISSUE',
  REPORT_PROVIDER = 'REPORT_PROVIDER',
  REPORT_EMPLOYEE = 'REPORT_EMPLOYEE',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
}

/* ================== TICKET MESSAGE SUBDOCUMENT ================== */

@Schema({ _id: true, timestamps: true })
export class TicketMessage {
    @ApiProperty({
    description: 'User ID who sent the message',
    example: '60f7c0b5e1d3c81234567890'})
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;


  @ApiProperty({
    description: 'Role of the user who sent the message',
    example: TicketUserRole.CUSTOMER})
  @Prop({ enum: TicketUserRole, required: true })
  senderRole: TicketUserRole;


  @ApiProperty({
    description: 'Content of the message',
      example: [
      {
        senderId: '60f7c0b5e1d3c81234567890',
        senderRole: TicketUserRole.CUSTOMER,
        message: 'I have an issue with my booking.',
        isInternalNote: false,
      },
      {
        senderId: '60f7c0b5e1d3c81234567890',
        senderRole: TicketUserRole.ADMIN,
        message: 'We are looking into this issue.',
        isInternalNote: true,
      },
    ],
  })
  @Prop({ required: false })
  message: string;

  @ApiProperty({
    description: 'Whether the message is an internal note (visible only to admins or super admins)',
    example: false})
  @Prop({ default: false })
  isInternalNote: boolean;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

/* ================== TICKET ================== */

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true, collection: 'tickets' })
export class Ticket {
  @ApiProperty({
    description: 'User ID who created the ticket',
    example: '60f7c0b5e1d3c81234567890' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ 
    enum: TicketUserRole, 
    description: 'Role of the user who created the ticket',
    example: TicketUserRole.CUSTOMER })
  @Prop({ enum: TicketUserRole, required: true })
  createdByRole: TicketUserRole;

  @ApiProperty({
    description:"Status of the ticket", 
    enum: TicketStatus, 
    example: TicketStatus.OPEN})
  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @ApiProperty({
    description:"Priority of the ticket", 
    enum: TicketPriority,
    example: TicketPriority.MEDIUM})
  @Prop({ enum: TicketPriority, default: TicketPriority.LOW })
  priority: TicketPriority;


  @ApiProperty({ 
    enum: TicketCategory,
    description: 'Category of the ticket',
    example: TicketCategory.BOOKING_ISSUE })
  @Prop({ enum: TicketCategory, required: true })
  category: TicketCategory;

  @ApiProperty({
    description: 'Subject of the ticket',
    example: 'Issue with booking' })
  @Prop({ required: true })
  subject: string;

  @ApiPropertyOptional({
    description: 'ID of the assigned admin (if any)',
    example: '60f7c0b5e1d3c81234567890' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedAdminId?: Types.ObjectId;

  // Messages as subdocuments
  @ApiPropertyOptional({
    type: [TicketMessage],
    description: 'Array of messages and internal notes related to the ticket',
    example: [
      {
        senderId: '60f7c0b5e1d3c81234567890',
        senderRole: TicketUserRole.CUSTOMER,
        message: 'I have an issue with my booking.',
        isInternalNote: false,
      },
      {
        senderId: '60f7c0b5e1d3c81234567890',
        senderRole: TicketUserRole.ADMIN,
        message: 'We are looking into this issue.',
        isInternalNote: true,
      },
    ],
  })
  @Prop({ type: [TicketMessageSchema], default: [] })
  messages?: TicketMessage[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
