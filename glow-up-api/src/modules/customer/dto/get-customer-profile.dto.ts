
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerGender, GenderType } from 'src/common/enum/gendertype.enum';

export class CustomerMeUserDto {
  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d2' })
  id: string;

  @ApiPropertyOptional({ example: '+970599000000' })
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;

  @ApiPropertyOptional({ enum: CustomerGender, example: 'MALE' })
  gender?: CustomerGender;

  @ApiPropertyOptional({ example: '1998-05-10T00:00:00.000Z' })
  birthDate?: Date;
}
export class CustomerFavoriteProviderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  profileImage?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  rating?: number;
}

// export class GetCustomerMeResponseDto {
//   @ApiProperty()
//   id: string;

//   @ApiProperty()
//   firstName: string;

//   @ApiProperty()
//   lastName: string;


//   @ApiProperty()
//   email?: string;
//   @ApiPropertyOptional()
//   avatar?: string;

//   @ApiPropertyOptional()
//   city?: string;

//   @ApiPropertyOptional()
//   address?: string;

//   @ApiProperty({ type: CustomerMeUserDto })
//   user: CustomerMeUserDto;

//   @ApiProperty({ type: [CustomerFavoriteProviderDto] })
//   favorites: CustomerFavoriteProviderDto[];

//   @ApiPropertyOptional()
//   createdAt?: Date;

//   @ApiPropertyOptional()
//   updatedAt?: Date;
// }

export class GetCustomerMeResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty({ example: 'Ahmed', description: 'First name of the customer' })
  firstName: string;

  @ApiProperty({ example: 'Al Toba', description: 'Last name of the customer' })
  lastName: string;

  @ApiProperty({
    enum: CustomerGender,
    example: 'MALE',
    description: 'Gender of the customer',
    required: false,
  })
  gender?: CustomerGender;

  @ApiProperty({
    example: '1998-05-10T00:00:00.000Z',
    description: 'Birth date of the customer',
    required: false,
  })
  birthDate?: Date;

   @ApiProperty({ example: 'email@gmail.com', description: ' customer email' })
  email?: string;

   @ApiProperty({ example: '0500000000', description: 'customer phone' })
  phone: string;
}
