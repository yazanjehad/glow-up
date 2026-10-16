import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTicketMessageDto {
  @ApiProperty({ example: 'Any update on this issue?' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}
