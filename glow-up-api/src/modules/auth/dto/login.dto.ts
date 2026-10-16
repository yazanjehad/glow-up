import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@mail.com OR 0791234567',
    description: 'Email or phone number',
  })

  @IsString({ message: 'common.errors.IDENTIFIER_STRING' })
  @IsNotEmpty({ message: 'common.errors.IDENTIFIER_REQUIRED' })
  identifier: string;

  @ApiProperty({
    example: 'StrongPass@123',
    description: 'User password',
  })
  @IsString({ message: 'common.errors.PASSWORD_STRING' })
  @IsNotEmpty({ message: 'common.errors.PASSWORD_REQUIRED' })
  password: string;
}
