// reviews items -- Component Review
export type ReviewItem = {
  id: string;
  userName: string;
  rate: Star;
  avatar?: string;
  date: string;
  note: string;
};

export type RatingSummaryUI = {
  averageRate: number;
  totalReviews: number;
  distribution: RatingDistributionItem[];
}

export type ReviewUI = {
  reviews: ReviewItem[];
  summary: RatingSummaryUI;
}

type Star = 1 | 2 | 3 | 4 | 5;
type ReviewStars = Record<Star, number>;
export type RatingSummaryApiResponse = {
  averageRate: number;
  totalReviews: number;
  distribution: ReviewStars;
}

export type RatingReviewsApiResponse = {
  id: string;
  rating: Star;
  comment?: string;
  createdAt: string;
  customer: { id: string; name: string };
}

export type RatingApiResponse = {
  summary: RatingSummaryApiResponse;
  reviews: RatingReviewsApiResponse[];
  currentPage: number;
  totalPages: number;
}

// rating item -- component reviews summary
export type RatingDistributionItem = {
  rating: 1 | 2 | 3 | 4 | 5;
  count: number;
  value: number;
};

// reviews response -- component reviews page
export type ReviewsApiResponse = {
  averageRate: number;
  numOfReviews: number;
  distribution: RatingDistributionItem[];
  reviews: ReviewItem[];
};

export type ProviderRatingApiDto = {
  id: string;
  rating: Star;
  comment?: string;
  provider: { id: string; name: string };
  customer: { id: string; name: string };
};

export type ProviderRatingsApiResponse = ProviderRatingApiDto[];


export const mapApiToPublicReviews = (item: RatingApiResponse): ReviewUI => {
  const reviewItems: ReviewItem[] = [];
  item?.reviews?.forEach(element => {
    const reviewItem: ReviewItem = {
      id: element.id,
      userName: element.customer.name,
      rate: element.rating,
      date: element.createdAt,
      note: element.comment ?? "",
    }
    reviewItems.push(reviewItem);
  });

  const distribution: RatingDistributionItem[] = [];
  let calculatedTotalScore = 0;
  let calculatedTotalReviews = 0;

  const distObj = item.summary?.distribution || {} as ReviewStars;

  const stars: Star[] = [5, 4, 3, 2, 1];
  stars.forEach((star) => {
    const count = distObj[star] || 0;
    calculatedTotalScore += star * count;
    calculatedTotalReviews += count;
  });

  const totalReviews = item.summary?.totalReviews > 0 ? item.summary.totalReviews : calculatedTotalReviews;
  
  stars.forEach((star) => {
    const count = distObj[star] || 0;
    distribution.push({
      rating: star,
      count: count,
      value: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    });
  });

  let averageRate = item.summary?.averageRate;
  if (!averageRate && totalReviews > 0) {
    averageRate = Number((calculatedTotalScore / totalReviews).toFixed(1));
  }

  const summary: RatingSummaryUI = {
    averageRate: averageRate || 0,
    totalReviews: totalReviews,
    distribution: distribution,
  }
  return {
    reviews: reviewItems,
    summary: summary,
  };
};

export const emptyReviewsApiResponse = (): ReviewUI => {
  return {
    reviews: [],
    summary: {
      averageRate: 0,
      totalReviews: 0,
      distribution: [
        { rating: 5, count: 0, value: 0 },
        { rating: 4, count: 0, value: 0 },
        { rating: 3, count: 0, value: 0 },
        { rating: 2, count: 0, value: 0 },
        { rating: 1, count: 0, value: 0 },
      ]
    },
  };
};
