"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";

import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ReviewsSummary } from "@/components/reviews/ReviewsSummary";
import { ReviewsList } from "@/components/reviews/ReviewsList";

import { RatingsService } from "@/integration/services/Ratings/ratings.service";
import { emptyReviewsApiResponse, ReviewUI } from "@/app/models/Review-types";
import { useBookingStore } from "@/store/bookingStore";

export default function ReviewsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { selectedProviderID } = useBookingStore();
  const params = useParams<{ id: string }>();
  const providerId = params?.id;

  const [data, setData] = useState<ReviewUI>(
    emptyReviewsApiResponse(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!providerId) {
      setError("providerId missing");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await RatingsService.getPublicReviews(providerId, 1, 10);

        if (!cancelled) setData(res);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message || e?.message || "فشل تحميل المراجعات";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 flex flex-col">
        <TopBar
          titleKey="reviewsPage.title"
          iconHref={selectedProviderID ? `/salon/${selectedProviderID}` : "/home"}
          iconAriaLabelKey="reviewsPage.backAria"
          icon={
            isRTL ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )
          }
        />

        <div className="max-w-6xl w-full mx-auto px-4 py-8 flex-1">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[329px_1fr]">
            <div className="lg:sticky lg:top-24 self-start order-1 md:order-none">
              <ReviewsSummary
                averageRate={data.summary?.averageRate ?? 0}
                numOfReviews={data.summary?.totalReviews ?? 0}
                distribution={data.summary?.distribution ?? []}
              />
            </div>

            <div className="w-full min-h-[400px] rounded-[20px] bg-white p-6 shadow-[0px_8px_32px_0px_#00000014] flex flex-col">
              {loading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="w-8 h-8 border-4 border-[#79A66B] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-sm text-red-600 text-center py-10">{error}</div>
              ) : data.reviews.length === 0 ? (
                <div className="flex items-center justify-center flex-1 py-20">
                  <div className="text-center text-gray-500 text-lg font-medium">
                    {t("reviewsPage.noReviewsYet")}
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <ReviewsList reviews={data.reviews} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
