"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { ReviewsSummary } from "@/components/reviews/ReviewsSummary";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { RatingsService } from "@/integration/services/Ratings/ratings.service";
import { emptyReviewsApiResponse, ReviewUI } from "@/app/models/Review-types";

export default function SuperAdminSalonReviewsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const providerId = params?.id;

  const [data, setData] = useState<ReviewUI>(emptyReviewsApiResponse());
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
        const res = await RatingsService.getPublicReviews(providerId, 1, 50);
        if (!cancelled) setData(res);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string }; message?: string } })?.response?.data?.message ||
          (e as { message?: string })?.message ||
          "فشل تحميل المراجعات";
        if (!cancelled) setError(String(msg));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const handleBack = () => {
    router.push(`/super-admin-dashboard/salons/${providerId}`);
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] py-8 px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#79A66B] transition-colors"
        >
          <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          <span>{t("back")}</span>
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[329px_1fr]">
          <div className="lg:sticky lg:top-24 self-start">
            <ReviewsSummary
              averageRate={data.summary?.averageRate ?? 0}
              numOfReviews={data.summary?.totalReviews ?? 0}
              distribution={data.summary?.distribution ?? []}
            />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 min-h-[320px]">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("salonDetailsInfo.reviews")} ({data.reviews?.length ?? 0})
            </h2>
            {loading ? (
              <div className="text-sm text-gray-500 py-8">Loading...</div>
            ) : error ? (
              <div className="text-sm text-red-600 py-4">{error}</div>
            ) : !data.reviews?.length ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 font-medium">
                  {t("reviewsPage.noReviewsYet")}
                </p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <ReviewsList reviews={data.reviews} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
