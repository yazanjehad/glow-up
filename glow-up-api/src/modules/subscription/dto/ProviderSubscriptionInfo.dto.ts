import { ApiProperty } from '@nestjs/swagger';
import { GetPlansResponseDto } from './GetPlansResponse.dto';

export class ProviderSubscriptionInfoDto {
 @ApiProperty({ description: 'ID of the subscription' })
  id: string;

  @ApiProperty({ description: 'ID of the provider' })
  providerId: string;

  @ApiProperty({ description: 'ID of the plan subscribed' })
  planId: GetPlansResponseDto;

  @ApiProperty({ description: 'Snapshot of the plan details at the time of subscription' })
  plan: {
    name: string;
    price: number;
    durationDays: number;
    commissionPercent: number;
  };

  @ApiProperty({ description: 'Start date of the subscription' })
  startDate: Date;

  @ApiProperty({ description: 'End date of the subscription', required: false })
  endDate?: Date;

  @ApiProperty({ description: 'Status of the subscription' })
  status: string;

  @ApiProperty({ description: 'Optional notes for the subscription', required: false })
  notes?: string;

  @ApiProperty({ description: 'Creation date of the subscription' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date of the subscription' })
  updatedAt: Date;

  @ApiProperty({ description: 'Number of remaining days for the subscription', required: false })
  remainingDays?: number;
}