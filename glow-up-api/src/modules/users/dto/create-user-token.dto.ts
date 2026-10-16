import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddUserTokenDto {
  @ApiProperty({
    example: 'your_push_token_here',
    description: 'FCM / push notification token for the user',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
