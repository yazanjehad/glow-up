import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '../../users/enum/userstatus.enum';

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.SUSPENDED,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
