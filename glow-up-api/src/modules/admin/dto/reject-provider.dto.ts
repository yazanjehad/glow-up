import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectProviderDto {
  @ApiProperty({
    example: 'Missing documents',
    description: 'Reason for rejecting service provider',
  })
  @IsNotEmpty({ message: 'common.errors.REJECTION_REASON_REQUIRED' })
  @IsString({ message: 'common.errors.REJECTION_REASON_STRING' })
  reason: string;
}
