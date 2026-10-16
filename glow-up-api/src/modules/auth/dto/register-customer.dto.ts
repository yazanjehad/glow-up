import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { GenderType } from '../../../common/enum/gendertype.enum';
import { BirthDateValidator } from '../../../common/validators/birthdate.validator';

export class RegisterCustomerDto {
  @ApiProperty({
    example: 'Ahmed',
    description: 'Customer first name',
  })
  @MaxLength(255, { message: 'common.errors.FIRSTNAME_MAX_LENGTH' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.FIRSTNAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.FIRSTNAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.FIRSTNAME_REQUIRED' })
  firstname: string;

  @ApiProperty({
    example: 'Ahmed',
    description: 'Customer last name',
  })
  @MaxLength(255, { message: 'common.errors.LASTNAME_MAX_LENGTH' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.LASTNAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.LASTNAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.LASTNAME_REQUIRED' })
  lastname: string;

  @ApiProperty({
    example: 'ahmed@mail.com',
    description: 'Customer email',
  })
  @IsOptional()
  @IsEmail({}, { message: 'common.errors.EMAIL_INVALID' })
  email?: string;

  @ApiProperty({
    example: 'StrongPass@123',
    description: 'Customer password',
  })
  @IsOptional()
  @IsString({ message: 'common.errors.PASSWORD_STRING' })
  @MinLength(8, { message: 'common.errors.PASSWORD_MIN_LENGTH' })
  password?: string;

  @ApiPropertyOptional({
    example: 'MALE',
    description: 'Gender of the customer',
    enum: GenderType,
  })
  @IsOptional()
  @IsEnum(GenderType, { message: 'common.errors.GENDER_INVALID' })
  gender?: GenderType;

  @ApiPropertyOptional({
    example: '2000-05-15',
    description: 'User birth date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'common.errors.BIRTHDATE_INVALID' })
  @Validate(BirthDateValidator)
  birthDate?: string;
}
