import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEmployeeCapabilitiesDto {
  @ApiPropertyOptional({
    description: 'Can the employee login',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  canLogin?: boolean;

  @ApiPropertyOptional({
    description: 'Can view own bookings',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  canViewOwnBookings?: boolean;

  @ApiPropertyOptional({
    description: 'Can view statistics',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  canViewStatistics?: boolean;

  @ApiPropertyOptional({
    description: 'Can add break time',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  canManageBreakTime?: boolean;
}
