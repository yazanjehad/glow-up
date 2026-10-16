import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsOptional, IsPositive } from 'class-validator';
 
export class RatingCustomerDto {
  @ApiProperty({ example: '65f1c8e2b3a9c9d123456789' })
  id: string;

  @ApiProperty({ example: 'Ahmad Ali' })
  name: string;

  // @ApiPropertyOptional({ example: 'https://cdn.app/avatar.png' })
  // avatar?: string | null;
}

export class ProviderReviewDto {
  @ApiProperty({ example: '65f1c8e2b3a9c9d987654321' })
  id: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: 'Great service and friendly staff' })
  comment: string;

  @ApiProperty({ example: '2025-02-01T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: RatingCustomerDto })
  customer: RatingCustomerDto;
}

export class RatingDistributionDto {
  @ApiProperty({ example: 12 })
  '5': number;

  @ApiProperty({ example: 8 })
  '4': number;

  @ApiProperty({ example: 3 })
  '3': number;

  @ApiProperty({ example: 1 })
  '2': number;

  @ApiProperty({ example: 0 })
  '1': number;
}

export class RatingSummaryDto {
  @ApiProperty({ example: 4.6 })
  averageRating: number;

  @ApiProperty({ example: 24 })
  totalReviews: number;

  @ApiProperty({ type: RatingDistributionDto })
  distribution: RatingDistributionDto;
}

export class ProviderRatingsResponseDto {
  @ApiProperty({ type: RatingSummaryDto })
  summary: RatingSummaryDto;

  @ApiProperty({ type: [ProviderReviewDto] })
  reviews: ProviderReviewDto[];

  @ApiProperty({ example: 1 })
  current_page: number;

  @ApiProperty({ example: 3 })
  total_pages: number;
}


// dto/get-ratings-query.dto.ts
 
export class GetRatingsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({ example: '67d111111111111111111111' })
  @IsOptional()
  @IsMongoId()
  providerId?: string;

  @ApiPropertyOptional({ example: '67d222222222222222222222' })
  @IsOptional()
  @IsMongoId()
  customerId?: string;
}
export class RatingResponseDto {
  @ApiProperty({
    example: '65c9f1e2a1b3c45678901234',
    description: 'Rating ID',
  })
  id: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Rating value',
  })
  rating: number;

  @ApiPropertyOptional({
    example: 'Great service!',
    description: 'Optional customer comment',
  })
  comment?: string;

  @ApiProperty({
    description: 'Service provider info',
    example: {
      id: '65c9f1e2a1b3c45678901111',
      name: 'Glow Salon',
    },
  })
  provider: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Customer info',
    example: {
      id: '65c9f1e2a1b3c45678902222',
      name: 'John Doe',
    },
  })
  customer: {
    id: string;
    name: string;
  };

  @ApiProperty({
    example: '2026-01-21T10:20:30.000Z',
    description: 'Rating creation date',
  })
  createdAt?: string;

}
// dto/get-ratings-paginated-response.dto.ts
 
class RatingsPaginationMetaDto {
  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class GetRatingsPaginatedResponseDto {
  @ApiProperty({ type: [RatingResponseDto] })
  items: RatingResponseDto[];

  @ApiProperty({ type: RatingsPaginationMetaDto })
  meta: RatingsPaginationMetaDto;
}