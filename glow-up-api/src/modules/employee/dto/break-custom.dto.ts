import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { BreakStatus } from "src/common/enum/break-status.enum";

export class BreakCustomRequestDto {

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

export class BreakStatusUpdateDto {
  @ApiProperty({ enum: BreakStatus, example: BreakStatus.APPROVED })
  @IsEnum(BreakStatus)
  status: BreakStatus;
}

export class GetCustomBreaksQueryDto {
  @ApiPropertyOptional({ example: '65f1a2b3c4d5e6f7a8b9c0d2' })
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ enum: BreakStatus ,example: BreakStatus.APPROVED})
  @IsOptional()
  @IsEnum(BreakStatus)
  status?: BreakStatus;

  @ApiPropertyOptional({ default: 1,example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 ,example: 10})
  @IsOptional()
  limit?: number = 10;
}
