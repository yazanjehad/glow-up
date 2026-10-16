import { ApiProperty } from '@nestjs/swagger';
import { AdStatus } from '../../../common/enum/adsstatus.enum';

export class GetAdminAdDto {
  @ApiProperty({ example: 'Best Ramadan Offer' })
  title: string;

  @ApiProperty({ example: 'Get 50% off for all services' })
  description: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  image: string;

  @ApiProperty({ example: 'saloonId123' })
  link_to: string;

  @ApiProperty({ enum: AdStatus, example: AdStatus.PENDING })
  status: AdStatus;

  @ApiProperty({ example: 'providerId123' })
  providerId: string;

  @ApiProperty({ example: '2026-02-05T11:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-02-05T11:15:00Z' })
  updatedAt: Date;
}
