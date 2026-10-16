import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Matches } from "class-validator";
import { IsLocalPhone05 } from "src/common/validators/is-local-sa-phone.decorator";

export class VerifyOtpDto {
  @ApiProperty({
    example: '0555123456',
    description: 'Phone number starting with 05 and 10 digits',
  })
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  @IsLocalPhone05({ message: 'common.errors.PHONE_INVALID' })
  phone: string;

  @ApiProperty({
    example: '1234',
    description: ' OTP code must be exactly 4 digits',
  })
  @Matches(/^\d{4}$/, {
    message: 'common.errors.OTP_FORMAT',
  })
  @IsNotEmpty({ message: 'common.errors.OTP_REQUIRED' })
  code: string;
}
