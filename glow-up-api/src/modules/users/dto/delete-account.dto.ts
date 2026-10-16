import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class DeleteAccountDto {

     @ApiProperty({
    example: '1234',
    description: ' OTP code must be exactly 4 digits',
  })
  @Matches(/^\d{4}$/, {
    message: 'common.errors.OTP_FORMAT',
  })
  @IsNotEmpty({ message: 'common.errors.OTP_REQUIRED' })
  code: string;
  
    
  @ApiProperty({
    description: 'Reason for deleting the account',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}