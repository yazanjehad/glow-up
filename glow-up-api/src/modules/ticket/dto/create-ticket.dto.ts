import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketCategory } from '../schemas/ticket.schema';



export class CreateTicketDto {
  @ApiProperty({ enum: TicketCategory , example: TicketCategory.ACCOUNT_ISSUE, description: 'Category of the ticket' })
  @IsNotEmpty({ message: 'common.errors.TICKET_CATEGORY_REQUIRED' })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiProperty({ example: 'Problem with my booking' })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.TICKET_SUBJECT_REQUIRED' })
  subject: string;

  @ApiProperty({ example: 'I was charged twice for my appointment' })
  @IsString()
  @IsOptional()
  message?: string;
}
