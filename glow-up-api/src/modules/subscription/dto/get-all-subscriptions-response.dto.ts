import { ApiProperty } from '@nestjs/swagger';

class SubscriptionPlanInfoDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}

class ProviderInfoDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  businessName: string;
}

class SubscriptionItemDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ type: ProviderInfoDto })
  providerId: ProviderInfoDto;

  @ApiProperty({ type: SubscriptionPlanInfoDto })
  planId: SubscriptionPlanInfoDto;

  @ApiProperty()
  startDate: Date;

  @ApiProperty({ nullable: true })
  endDate: Date | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPrevPage: boolean;
}

export class GetAllSubscriptionsResponseDto {
  @ApiProperty({ type: [SubscriptionItemDto] })
  items: SubscriptionItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}