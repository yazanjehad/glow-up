import { ApiProperty } from '@nestjs/swagger';

export class GetPublicAdDto {
  @ApiProperty({ example: 'Best Ramadan Offer' })
  title: string;

  @ApiProperty({ example: 'Get 50% off for all services' })
  description: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  image: string;

  @ApiProperty({ example: 'saloonId123' })
  link_to: string;
}
