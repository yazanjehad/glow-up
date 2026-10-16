import { ApiProperty } from '@nestjs/swagger';
import { RoleType } from 'src/common/enum/roletype.enum';
import { IsLocalPhone05 } from 'src/common/validators/is-local-sa-phone.decorator';

class ServiceAddedByDto {
  @ApiProperty({ example: '64f8c9b6d3e2c123456789ab' })
  _id: string;

  @ApiProperty({ example: 'Yazan Provider' })
  name: string;

  @ApiProperty({ example: RoleType.PROVIDER, enum: RoleType })
  role: RoleType;
}

export class EmployeeServiceResponseDto {
  @ApiProperty({ example: '64f8c9b6d3e2c123456789ab' })
  serviceItemId: string;

  @ApiProperty({ type: ServiceAddedByDto })
  addedBy: ServiceAddedByDto;

  @ApiProperty({ example: '2026-01-29T12:19:50.948Z' })
  addedAt: Date;

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class EmployeeResponseDto {
  @ApiProperty({ example: '64f8c9b6d3e2c123456789ab' })
  id: string;

  @ApiProperty({ example: 'Ahmed Ali' })
  name: string;

  @ApiProperty({ example: 'MALE' })
  workfor: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  email: string;
  @ApiProperty({
    example: '0555123456',
    description: 'Phone number starting with 05 and 10 digits',
  })
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  phone: string;

  
  @ApiProperty({
    example: '69795dd0c19f459a2862bad7' ,
    description:'Lookup Item ID EMPLOYEE_POSITION'})
  position: any;

  @ApiProperty({ example: 'path/path' })
   profileImage: string;

  @ApiProperty({ example: 'Asia/Amman' })
  timezone: string;

  @ApiProperty({ type: [EmployeeServiceResponseDto] })
  services: EmployeeServiceResponseDto[];
}
