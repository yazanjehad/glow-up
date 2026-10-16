export class ProviderRatingDto {
  summary: {
    averageRating: number;
    totalReviews: number;
    distribution: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    customer: {
      id: string;
      name: string;
    };
  }>;
}
