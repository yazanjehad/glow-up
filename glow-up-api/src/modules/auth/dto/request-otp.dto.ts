import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';
import { IsLocalPhone05 } from 'src/common/validators/is-local-sa-phone.decorator';
 
export class RequestOtpDto {
 @ApiProperty({
    example: '0555123456',
    description: 'Phone number starting with 05 and 10 digits',
  })
 
@IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
 @IsNotEmpty({ message: 'common.errors.PHONE_REQUIRED' })

  phone: string;
}
