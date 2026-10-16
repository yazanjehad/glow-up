import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { IsLocalPhone05 } from "src/common/validators/is-local-sa-phone.decorator";

export class LoginVerifyOtpDto {
  @ApiProperty({
    example: '0555123456',
    description: 'Phone number starting with 05 and 10 digits',
  })
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  @IsNotEmpty({ message: 'common.errors.PHONE_REQUIRED' })
  phone: string;
  @ApiProperty({
    example: '1234',
    description: 'otp code',
  })
  @IsString()
  @IsNotEmpty({ message: 'common.errors.OTP_REQUIRED' })
  code: string;
}
