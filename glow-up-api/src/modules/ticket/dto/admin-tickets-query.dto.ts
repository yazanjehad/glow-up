// dto/my-tickets-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus, TicketCategory, TicketUserRole, TicketPriority } from '../schemas/ticket.schema';

export class adminTicketsQueryDto {
  @ApiPropertyOptional({ enum: TicketStatus,  description: 'Filter tickets by status' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketCategory ,  description: 'Filter tickets by category' })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;


@ApiPropertyOptional({ enum: TicketUserRole ,  description: 'Filter tickets by creator role' })
    @IsOptional()
  createdByRole?: string;

 
  @ApiPropertyOptional({ enum: TicketPriority,  description: 'Filter tickets by priority' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
