// dto/my-tickets-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus, TicketCategory } from '../schemas/ticket.schema';

export class MyTicketsQueryDto {
  @ApiPropertyOptional({ enum: TicketStatus, 
    description: 'Filter tickets by status',
     example: TicketStatus.OPEN })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketCategory , 
    example: TicketCategory.ACCOUNT_ISSUE, 
    description: 'Filter tickets by category' })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  
}
