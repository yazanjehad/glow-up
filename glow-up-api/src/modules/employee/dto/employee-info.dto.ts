import { ApiProperty } from '@nestjs/swagger';

export class EmployeeServiceDto {
  @ApiProperty()
  serviceItemId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  addedAt: Date;

  @ApiProperty({ nullable: true })
  name?: string;

  @ApiProperty({ nullable: true })
  description?: string;
}

export class EmployeeRatingDto {
  @ApiProperty()
  rating: number;

  @ApiProperty({ nullable: true })
  comment?: string;

  @ApiProperty()
  customerId: string;
}

export class EmployeeInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  email?: string;

  @ApiProperty({ nullable: true })
  phone?: string;
  @ApiProperty()
  profileImage?:string;
  @ApiProperty({ nullable: true })
  role?: string;

  @ApiProperty({ nullable: true })
  position?: any;

  @ApiProperty({ type: [EmployeeServiceDto] })
  services: EmployeeServiceDto[];

  @ApiProperty({ type: [EmployeeRatingDto] })
  ratings: EmployeeRatingDto[];

  @ApiProperty()
  totalRatings: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  isActive:boolean;
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
