import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsPhoneNumber, IsEmail, Matches, MaxLength } from 'class-validator';
import { IsLocalPhone05 } from 'src/common/validators/is-local-sa-phone.decorator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name' })
  @IsOptional()
  @MaxLength(255, { message: 'common.errors.PROVIDER_NAME' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.PROVIDER_NAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.PROVIDER_NAME_STRING' })
  name?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'common.errors.EMAIL_INVALID' })  
  email?: string;

  @ApiPropertyOptional({ example: '0500000000', description: 'Phone number' })
  @IsOptional()
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  phone?: string;

  @ApiPropertyOptional({ example: '1234', description: 'OTP code for phone change' })
  @IsOptional()
  @IsString()
    @Matches(/^\d{4}$/, {
    message: 'common.errors.OTP_FORMAT',
  })
  code?: string;
}

