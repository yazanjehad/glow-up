import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsDateString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { WeekDay } from 'src/common/enum/weekday.enum';
import { IsLocalPhone05 } from 'src/common/validators/is-local-sa-phone.decorator';
import { EmployeeWorkFor } from '../../../common/enum/employee-workfor.enum';

/* ======================================================
   WORKING HOURS NESTED DTOs
   ====================================================== */

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
  @ApiPropertyOptional({ example: '65f1c2a8e8f1d23bfc9d1111' })
  @IsOptional()
  @IsMongoId()
  _id?: string;
  @ApiProperty({ enum: WeekDay })
  @IsEnum(WeekDay)
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
  @ValidateNested({ each: true })
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
  @ApiPropertyOptional({ example: 'Asia/Riyadh'})
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
  @ValidateNested()
  @Type(() => WorkingBreaksDto)
  breaks?: WorkingBreaksDto;
}

/* ======================================================
   CREATE EMPLOYEE DTO
   ====================================================== */

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Ahmed Ali' })
  @Matches(/^[\p{L}]/u, { message: 'common.errors.EMPLOYEE_NAME_MUST_START_WITH_LETTER' })
  @MaxLength(255, { message: 'common.errors.EMPLOYEE_NAME_MAX_LENGTH' })
  @MinLength(3, { message: 'common.errors.EMPLOYEE_NAME_MIN_LENGTH' })
  @IsString({ message: 'common.errors.EMPLOYEE_NAME_STRING' })
  @IsNotEmpty({ message: 'common.errors.EMPLOYEE_NAME_REQUIRED' })
  name: string;

  @ApiPropertyOptional({
    example: '69795dd0c19f459a2862bad7',
    description: 'Lookup Item ID EMPLOYEE_POSITION',
  })
  @IsMongoId({ message: 'common.errors.EMPLOYEE_POSITION_ID_INVALID' })
  @IsNotEmpty( { message: 'common.errors.EMPLOYEE_POSITION_REQUIRED' })
  position?: string;

  @ApiPropertyOptional({ example: 'securePassword123' })
  @IsOptional()
  @IsString({ message: 'common.errors.PASSWORD_STRING' })
  @MinLength(8, { message: 'common.errors.PASSWORD_MIN_LENGTH' })
  password?: string;

@ApiPropertyOptional({ enum: EmployeeWorkFor, example: 'MALE' })
@IsOptional()
@IsEnum(EmployeeWorkFor, {
  message: 'common.errors.EMPLOYEE_WORK_FOR_ENUM',
})
workFor?: EmployeeWorkFor;
  
  @ApiPropertyOptional({
    description:
      'List of services to assign to the employee (EmployeeService IDs)',
    example: ['69795dd0c19f459a2862bad7'],
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  services?: string[];

 @ApiPropertyOptional({
  description: 'Employee working hours override',
  type: WorkingHoursDto,
  example: {
    timezone:'Asia/Riyadh',
    weekly: [
      {
        day: 'MONDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
         {
        day: 'TUESDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
         {
        day: 'WEDNESDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
         {
        day: 'THURSDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
         {
        day: 'FRIDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
         {
        day: 'SATURDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
         {
        day: 'SUNDAY',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      },
    ],
    breaks: {
      custom: [
        {
          _id: '65f1c2a8e8f1d23bfc9d2222',
          date: '2026-02-25',
          startTime: '15:00',
          endTime: '17:00',
          reason: 'Doctor appointment',
        
        },
      ],
    },
  },
})
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: '0555123456',
    description: 'Phone number starting with 05 and 10 digits',
  })
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  @IsNotEmpty({ message: 'common.errors.PHONE_REQUIRED' })
  phone: string;


 @ApiPropertyOptional({ example: true })
@IsOptional()
@IsBoolean({ message: 'common.errors.IS_ACTIVE_BOOLEAN' })
isActive?: boolean;
}
