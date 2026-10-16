import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdDto {
  @ApiProperty({ example: 'Best offer for Ramadan' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Get 50% off on all haircuts this Ramadan' })
  @IsString()
 
  description?: string;

  @ApiProperty({ example: 'requester ads' })
  @IsString()
   
  providerId?: string;

  @ApiProperty({ example: 'https://example.com/ad-image.jpg' })
  @IsString()
  @IsNotEmpty()
  banner: string;

  @ApiProperty({ example: '63f1a2b3c4d5e6f7a8b9c0d2' })
  @IsString()
  @IsNotEmpty()
  link_to: string;
}
