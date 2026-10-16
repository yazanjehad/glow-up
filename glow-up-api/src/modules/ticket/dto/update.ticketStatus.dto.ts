import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '../schemas/ticket.schema';

export class UpdateTicketStatus_PriorityDto {
  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    description: 'New status for the ticket',
  })
  @IsEnum(TicketStatus)
  status: TicketStatus

@ApiProperty({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
    description: 'Priority level of the ticket',
  })
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
    