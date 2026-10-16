import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WeekDay } from 'src/common/enum/weekday.enum';
import { GenderType } from 'src/common/enum/gendertype.enum';
import { ProviderType } from 'src/common/enum/providertype.enum';
import { ServiceLocation } from 'src/common/enum/service-location.enum';
import { appointmentStrategy } from 'src/common/enum/appointment-approve-strategy.enum';

/* ===== Sub DTOs ===== */

class ServiceItemDto {
  @ApiPropertyOptional({
    example: '65f1c2a8e8f1d23bfc9d1111',
    description: 'Item ID (for updates only)',
  })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({
    example: '65f1c2a8e8f1d23bfc9d1111',
    description: 'Lookup ID for SERVICE_TYPE',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.SERVICE_TYPE_REQUIRED' })
  type: string;

  @ApiProperty({ example: 'Haircut' })
  @IsString()
  @Matches(/^[\p{L}]/u, { message: 'common.errors.SERVICE_NAME_MUST_START_WITH_LETTER' })
  @MinLength(3, { message: 'common.errors.SERVICE_NAME_MIN_LENGTH' })
  @MaxLength(50, { message: 'common.errors.SERVICE_NAME_MAX_LENGTH' })
  @IsNotEmpty({ message: 'common.errors.SERVICE_NAME_REQUIRED' })
  name: string;

  @ApiProperty({ example: 50 })
  @Min(1, { message: 'common.errors.SERVICE_PRICE_MIN' })
  @IsNumber({}, { message: 'common.errors.SERVICE_PRICE_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'common.errors.SERVICE_PRICE_REQUIRED' })
  price: number;

  @ApiProperty({ example: 45 })
  @Min(1, { message: 'common.errors.SERVICE_DURATION_MIN' })
  @IsNumber({}, { message: 'common.errors.SERVICE_DURATION_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'common.errors.SERVICE_DURATION_REQUIRED' })
  durationMinutes: number;

  @ApiPropertyOptional({ example: 'Basic haircut service' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.app/service.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class ServiceCategoryDto {
  @ApiProperty({
    example: '65f1c2a8e8f1d23bfc9d1111',
    description: 'Lookup ID for SERVICE_CATEGORY',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.SERVICE_CATEGORY_REQUIRED' })
  category: string;

  @ApiProperty({ type: [ServiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  items: ServiceItemDto[];
}

export class WorkingDayDto {
  @ApiProperty({ enum: WeekDay })
  @IsEnum(WeekDay , { message: 'common.errors.WORKING_DAY_ENUM' })
  day: WeekDay;

  @ApiProperty()
  @IsBoolean()
  isOpen: boolean;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;
}

export class WorkingHourExceptionDto {
  @ApiProperty({ example: '2026-03-21' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsBoolean()
  isOpen: boolean;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ example: '20:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BreakWeeklyDto {

     @ApiPropertyOptional({example: '65f1c2a8e8f1d23bfc9d1111'})
    @IsOptional()
    @IsMongoId()
    _id?: string;

  @ApiProperty({ enum: WeekDay })
  @IsEnum(WeekDay , { message: 'common.errors.WORKING_DAY_ENUM' })
  day: WeekDay;

  @ApiProperty({ example: '13:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BreakCustomDto {

     @ApiPropertyOptional({ example: '65f1c2a8e8f1d23bfc9d1111' })
    @IsOptional()
    @IsMongoId()
    _id?: string;

  @ApiProperty({ example: '2026-02-25' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '15:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class WorkingBreaksDto {
  @ApiPropertyOptional({ type: [BreakWeeklyDto] })
  @IsOptional()
  @IsArray()
  // @ValidateNested({ each: true })
  @Type(() => BreakWeeklyDto)
  weekly?: BreakWeeklyDto[];

  @ApiPropertyOptional({ type: [BreakCustomDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakCustomDto)
  custom?: BreakCustomDto[];
}

export class WorkingHoursDto {
  @ApiPropertyOptional({ example: 'Asia/Riyadh' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ type: [WorkingDayDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingDayDto)
  weekly?: WorkingDayDto[];

  @ApiPropertyOptional({ type: [WorkingHourExceptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourExceptionDto)
  exceptions?: WorkingHourExceptionDto[];

  @ApiPropertyOptional({ type: WorkingBreaksDto })
  @IsOptional()
  // @ValidateNested()
  @Type(() => WorkingBreaksDto)
  breaks?: WorkingBreaksDto;
}

class PackageItemDto {
  @ApiProperty({ description: 'Service item ID' })
  @IsString()
  serviceItemId: string;

  @ApiProperty({ description: 'Quantity of this item', example: 1 })
  @IsNumber()
  quantity: number;
}

class PackageDto {

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @ApiProperty({ example: 'Full Haircut Package' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.PACKAGE_NAME_MUST_START_WITH_LETTER' })
  @MinLength(3, { message: 'common.errors.PACKAGE_NAME_MIN_LENGTH' })
  @MaxLength(255, { message: 'common.errors.PACKAGE_NAME_MAX_LENGTH' })
  @IsString( { message: 'common.errors.PACKAGE_NAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.PACKAGE_NAME_REQUIRED' })
  name: string;

  @ApiPropertyOptional({ example: 'Includes haircut + shampoo + styling' })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({ example: 50 })
  @Min(1 , { message: 'common.errors.PACKAGE_PRICE_MIN' })
  @IsNumber({}, { message: 'common.errors.PACKAGE_PRICE_NUMBER' })
  @IsNotEmpty({ message: 'common.errors.PACKAGE_PRICE_REQUIRED' })
  price: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [PackageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items: PackageItemDto[];
}


/* ===== Main DTO ===== */

export class CreateServiceProviderDto {
  /* ===== Basic Info ===== */

  @ApiProperty({ example: 'Glow Beauty Center' })
  @MaxLength(255, { message: 'common.errors.MAX_SERVICE_PROVIDER_NAME_LENGTH' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.SERVICE_PROVIDER_NAME_MUST_START_WITH_LETTER' })
  @IsString( { message: 'common.errors.SERVICE_PROVIDER_NAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.SERVICE_PROVIDER_NAME_REQUIRED' })
  name: string;

  @ApiPropertyOptional({ example: 'Professional beauty services' })
  @IsOptional()
  @MaxLength(500, { message: 'common.errors.SERVICE_PROVIDER_DESCRIPTION_MAX_LENGTH' })
  @IsString( { message: 'common.errors.SERVICE_PROVIDER_DESCRIPTION_STRING' })
  description?: string;

  @ApiProperty({
    example: '698243021cb58e7c7fe43201',
    description: 'Lookup Item ID for Provider Type',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ enum: GenderType })
@IsEnum(GenderType, { message: 'common.errors.SERVICE_GENDER_INVALID' })
  genderType?: GenderType;

  /* ===== Contact ===== */

  @ApiProperty({ example: ['+970599000000'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @ApiPropertyOptional({ example: 'contact@glow.com' })
  @IsOptional()
  @IsEmail({}, { message: 'common.errors.EMAIL_INVALID' })
  email?: string;
  @ApiProperty({
    example: 'StrongPass@123',
    description: 'Customer password',
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'common.errors.PASSWORD_MIN_LENGTH' })
  password?: string;

  /* ===== Service Location ===== */

  @ApiPropertyOptional({ enum: ServiceLocation })
  @IsOptional()
  @IsEnum(ServiceLocation , { message: 'common.errors.SERVICE_LOCATION_INVALID' })
  serviceLocation?: ServiceLocation;

  /* ===== Address ===== */

  @ApiPropertyOptional({ example: 'Ramallah ' })
  @IsOptional()
  @MinLength(3, { message: 'common.errors.SERVICE_PROVIDER_ADDRESS_MIN_LENGTH' })
  @MaxLength(255, { message: 'common.errors.SERVICE_PROVIDER_ADDRESS_MAX_LENGTH' })
//   @Matches(/^[\p{L}\d][\p{L}\d\s\-\/,#.]*$/u, {
//   message: 'common.errors.SERVICE_PROVIDER_ADDRESS_INVALID',
// })
  @IsString( { message: 'common.errors.SERVICE_PROVIDER_ADDRESS_STRING' })
  address?: string;

  /* ===== Location ===== */

  @ApiPropertyOptional({ example: 31.9038 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 35.9106 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  /* ===== Images ===== */

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  /* ===== Services ===== */

  @ApiPropertyOptional({ type: [ServiceCategoryDto] })
  @IsOptional()
  @IsArray()
@ValidateNested({ each: true })
  @Type(() => ServiceCategoryDto)
  services?: ServiceCategoryDto[];


  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deleteItems?: string[];

  /* ===== Packages ===== */
  @ApiPropertyOptional({ type: [PackageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages?: PackageDto[];


  /* ===== Working Hours ===== */

  @ApiPropertyOptional({ type: WorkingHoursDto ,
    description: 'Working hours for provider',
      example: {
        timezone: 'Asia/Riyadh',
        weekly: [
          { day: WeekDay.SUNDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
          { day: WeekDay.MONDAY, isOpen: true, openTime: '09:00', closeTime: '17:00' },
        ],
        breaks: {
      weekly: [
        { _id: '650f1c2a8e8f1d23bfc9d1111', day: WeekDay.MONDAY, startTime: '13:00', endTime: '13:30', reason: 'Lunch' },
        { _id: '650f1c2a8e8f1d23bfc9d1112', day: WeekDay.TUESDAY, startTime: '13:00', endTime: '13:30', reason: 'Lunch' }
      ],
      custom: [
        { _id: '650f1c2a8e8f1d23bfc9d1113', date: '2026-02-20', startTime: '13:00', endTime: '13:30', reason: 'holiday' }
      ]
        }
      }

  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;


  @ApiPropertyOptional({ enum: appointmentStrategy,example: 'DIRECT' })
  @IsOptional()
  @IsEnum(appointmentStrategy , { message: 'common.errors.APPOINTMENT_STRATEGY_INVALID' })
  appointmentStrategy?: appointmentStrategy
}
