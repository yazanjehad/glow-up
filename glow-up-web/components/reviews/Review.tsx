"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReviewItem } from "@/app/models/Review-types";

function formatReviewDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const localeTag = locale === "ar" ? "ar-SA" : "en-GB";
  const formatter = new Intl.DateTimeFormat(localeTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const dateStr = `${day} ${month} ${year}`;
  const timeStr = new Intl.DateTimeFormat(localeTag, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return locale === "ar" ? `${dateStr}، ${timeStr}` : `${dateStr}, ${timeStr}`;
}

// Review Component
type ReviewProps = {
  item: ReviewItem;
};

export function Review({ item }: ReviewProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const displayDate = item.date ? formatReviewDate(item.date, i18n.language) : null;

  return (
    <div className="w-full rounded-[20px] border border-[#E0E0E0] bg-white p-4">
      <div
        dir="ltr"
        className={`flex items-start justify-between gap-4 ${
          isRTL ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className="flex items-center gap-1 pt-1 flex-shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < item.rate
                  ? "text-orange-400 fill-orange-400"
                  : "text-gray-200"
              }`}
            />
          ))}
        </div>

        <div
          className={`flex items-start gap-3 ${
            isRTL ? "flex-row" : "flex-row-reverse"
          }`}
        >
          <div className={`${isRTL ? "text-right" : "text-left"}`}>
            <div className="text-[13px] font-semibold text-[#212121]">
              {item.userName}
            </div>
            {displayDate && (
              <div className="mt-0.5 text-[11px] text-gray-400">
                {displayDate}
              </div>
            )}

            <p
              className={`mt-2 max-w-[420px] text-[14px] font-normal leading-[20px] tracking-[0.14px] text-[#212121] ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {item.note}
            </p>
          </div>
          <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-100 flex-shrink-0">
            <Image
              src={item.avatar || "/placeholder.png"}
              alt={item.userName}
              width={36}
              height={36}
              className="h-9 w-9 object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
