import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ description: 'The ID of the appointment being rated', required: true })
  @IsMongoId()
  appointmentId: string;

  @ApiProperty({ description: 'Optional employee ID if rating is for an employee', required: false })
  @IsOptional()
  @IsMongoId()
  employeeId: string;


  @ApiProperty({ description: 'The rating score between 1 and 5', required: true, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;
  @ApiProperty({ description: 'Optional comment for the rating', required: false })
  @IsOptional()
  @IsString()
  comment?: string;


}
