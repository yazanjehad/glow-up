"use client";

import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { RatingProgressBar } from "@/components/reviews/RatingProgressBar";
import type { RatingDistributionItem } from "@/app/models/Review-types";

type ReviewsSummaryProps = {
  averageRate: number;
  numOfReviews: number;
  distribution: RatingDistributionItem[] | null;
};

export function ReviewsSummary({
  averageRate,
  numOfReviews,
  distribution,
}: ReviewsSummaryProps) {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === "en";

  const ordered = [...distribution ?? []].sort((a, b) => b.rating - a.rating);

  return (
    <div className="w-full rounded-[20px] bg-white p-6 shadow-[0px_8px_32px_0px_#00000014]">
      <div className="text-center">
        <div className="text-[16px] font-bold text-[#212121]">
          {t("reviewsPage.summaryTitle")} ({numOfReviews})
        </div>
        <div className="mt-2 text-[14px] text-[#9E9E9E]">
          {t("reviewsPage.summarySubtitle")}
        </div>
      </div>

      <div
        dir="ltr"
        className={`mt-8 flex items-start gap-6 ${
          isEnglish ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="w-[80px]">
          <div className="flex items-center gap-2">
            <div className="text-[32px] font-extrabold leading-[40px] text-[#212121]">
              {averageRate}
            </div>
            <Star className="h-5 w-5 text-orange-400 fill-orange-400" />
          </div>

          <div className="mt-1 text-[12px] text-[#9E9E9E]">
            {numOfReviews} {t("reviewsPage.reviewWord")}
          </div>
        </div>

        <div className="flex-1 space-y-3 pt-1">
          {ordered.map((item) => (
            <div
              key={item.rating}
              className={`flex items-center gap-3 ${
                isEnglish ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <span
                className={`w-[14px] text-[12px] text-[#757575] ${
                  isEnglish ? "text-left" : "text-right"
                }`}
              >
                {item.rating}
              </span>
              <div className="flex-1">
                <RatingProgressBar value={item.value} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
