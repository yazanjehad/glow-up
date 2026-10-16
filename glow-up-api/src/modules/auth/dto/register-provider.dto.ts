import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterProviderDto {
  @ApiProperty({
    example: 'Yazan Provider',
    description: 'Provider owner full name',
  })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.PROVIDER_NAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.PROVIDER_NAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.PROVIDER_NAME_REQUIRED' })
  name: string;

  @ApiProperty({
    example: 'owner@glow.com',
    description: 'Provider email',
  })

  @IsDefined({ message: 'common.errors.EMAIL_REQUIRED' })
  @IsEmail({}, { message: 'common.errors.EMAIL_INVALID' })
  email: string;


  @ApiProperty({
    example: 'StrongPass@123',
    description: 'Provider password',
  })
  @IsOptional()
  @IsString({ message: 'common.errors.PASSWORD_STRING' })
  @MinLength(8, { message: 'common.errors.PASSWORD_MIN_LENGTH' })
  password?: string;
}
