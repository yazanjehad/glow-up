"use client";

import type { ReviewItem } from "@/app/models/Review-types";
import { Review } from "@/components/reviews/Review";

// ReviewsList Component
type ReviewsListProps = {
  reviews: ReviewItem[];
};

export function ReviewsList({ reviews }: ReviewsListProps) {
  return (
    <div className="w-full flex flex-col gap-3">
      {reviews.map((r) => (
        <Review key={r.id} item={r} />
      ))}
    </div>
  );
}
