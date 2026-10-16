import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IsLocalPhone05 } from 'src/common/validators/is-local-sa-phone.decorator';

export class CreateAdminDto {
  @ApiProperty({
    example: 'Admin User',
    description: 'Admin full name',
  })
  @IsNotEmpty({ message: 'common.errors.ADMIN_NAME_REQUIRED' })
  @IsString({ message: 'common.errors.ADMIN_NAME_STRING' })
  name: string;

  @ApiProperty({
    example: 'admin@glow.com',
    description: 'Admin email address',
  })
  @IsEmail({}, { message: 'common.errors.EMAIL_INVALID' })
  @IsNotEmpty({ message: 'common.errors.EMAIL_REQUIRED' })
  email: string;


  @ApiPropertyOptional({
    example: 'Operations admin',
    description: 'Optional note about admin role',
  })
  @IsOptional()
  @IsString({ message: 'common.errors.NOTE_STRING' })
  note?: string;

  @ApiProperty({
    example: '0555123456',
    description: 'Phone number starting with 05 and 10 digits',
  })
  @IsNotEmpty({ message: 'common.errors.PHONE_REQUIRED' })
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  phone: string;
}
