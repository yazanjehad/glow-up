import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProviderStatus } from 'src/common/enum/providerstatus.enum';

export class UpdateProviderStatusDto {
  @IsEnum(ProviderStatus)
  @ApiProperty({
    enum: ProviderStatus,
    example: ProviderStatus.APPROVED,
    description: 'New status for the provider',
  })
  status: ProviderStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Reason if rejection or suspension',
    description: 'Reason for rejection or suspension (required if status is REJECTED or SUSPENDED)',
  })
  reason?: string;
}
