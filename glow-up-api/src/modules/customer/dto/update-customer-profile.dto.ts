import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength, Validate } from 'class-validator';
import {
  CustomerGender,
  GenderType,
} from '../../../common/enum/gendertype.enum';
import { BirthDateValidator } from '../../../common/validators/birthdate.validator';

/*
@MaxLength(255, { message: 'common.errors.FIRSTNAME_MAX_LENGTH' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.FIRSTNAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.FIRSTNAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.FIRSTNAME_REQUIRED' })
*/
export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ example: 'ahmad' })
  @IsOptional()
  @MaxLength(255, { message: 'common.errors.FIRSTNAME_MAX_LENGTH' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.FIRSTNAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.FIRSTNAME_STRING' })
  firstName?: string;


  @ApiPropertyOptional({ example: 'amer' })
  @IsOptional()
  @MaxLength(255, { message: 'common.errors.LASTNAME_MAX_LENGTH' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.LASTNAME_MUST_START_WITH_LETTER' })
  @IsString({ message: 'common.errors.LASTNAME_STRING' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'MALE', enum: CustomerGender })
  @IsOptional()
  @IsEnum(CustomerGender, { message: 'common.errors.GENDER_INVALID' })
  gender?: CustomerGender;

  @ApiPropertyOptional({ example: '2000-05-15' })
  @IsOptional()
  @IsDateString({}, { message: 'common.errors.BIRTHDATE_INVALID' })
  @Validate(BirthDateValidator)
  birthDate?: string;
}
