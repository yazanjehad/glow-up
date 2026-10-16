import { ApiProperty } from '@nestjs/swagger';

export class GetPlansResponseDto {
  @ApiProperty({ description: 'ID of the plan' })
  id: string;

  @ApiProperty({ description: 'Name of the subscription plan' })
  name: string;

  @ApiProperty({ description: 'Price of the subscription plan' })
  price: number;

  @ApiProperty({ description: 'Duration of the plan in days' })
  durationDays: number;

  @ApiProperty({ description: 'Commission percentage for this plan', required: false })
  commissionPercent?: number;

  @ApiProperty({ description: 'Whether the plan is active or not' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date of the plan' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of the plan' })
  updatedAt: Date;
}
