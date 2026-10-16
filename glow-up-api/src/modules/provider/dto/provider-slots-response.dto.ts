import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SlotItemDto {
  @ApiProperty({ example: '10:00' })
  time: string;

  @ApiProperty({ example: true })
  available: boolean;
}

export class ProviderSlotsResponseDto {
  @ApiProperty({ example: '2026-01-26' })
  date: string;

  @ApiProperty({ example: 'MONDAY' })
  day: string;

  @ApiProperty({ example: true })
  isOpen: boolean;

  @ApiPropertyOptional({ example: '09:00' })
  openTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  closeTime?: string;

  @ApiPropertyOptional({ example: 30 })
  slotDuration?: number;

  @ApiProperty({ type: [SlotItemDto] })
  slots: SlotItemDto[];
}