"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Heart, MessageCircle, Star, Mars, Venus, MapPin, Clock } from "lucide-react";
import type { SalonUi } from "@/integration/services/provider/provider.types";
import { getToken } from "@/integration/services/auth/authServices";
import { cn } from "@/lib/utils";

type Props = {
  salon: SalonUi;
  inputLabel: string;
  showTitle?: boolean;

  // optional controlled behavior
  isFavorited?: boolean;
  onFavoriteClick?: () => void;

  // Actions visibility control (used by admin screens)
  showFavorite?: boolean;
  showChat?: boolean;
};

export default function SalonDetailsCard({
  salon,
  inputLabel,
  showTitle = false,
  isFavorited: isFavoritedProp,
  onFavoriteClick,
  showFavorite = true,
  showChat = true,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [isFavoritedLocal, setIsFavoritedLocal] = useState(false);
  const isFavorited = isFavoritedProp ?? isFavoritedLocal;

  const isAuthenticated = typeof window !== "undefined" && !!getToken();

  const handleFavoriteClick = () => {
    if (!isAuthenticated) return;

    // if parent provided handler => use it
    if (onFavoriteClick) {
      onFavoriteClick();
      return;
    }
    // otherwise toggle locally
    setIsFavoritedLocal((prev) => !prev);
  };

  const openLabel = useMemo(() => {
    if (!salon.isOpen) return t("bookingDetails.salonDetails.closedNow");
    if (!salon.openUntil) return t("bookingDetails.salonDetails.openNow");

    return `${t("bookingDetails.salonDetails.openNow")} - ${t(
      "bookingDetails.salonDetails.until",
      { time: salon.openUntil }
    )}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon.isOpen, salon.openUntil, t]);

  const nextOpeningMessage = useMemo(() => {
    if (salon.isOpen || !salon.nextOpening) return null;

    const { day, time } = salon.nextOpening;
    const dayName = t(`days.${day.toLowerCase()}`);

    const formatTime = (tStr: string) => {
      const [h, m] = tStr.split(":").map(Number);
      const period = h >= 12 ? (isRTL ? "م" : "PM") : (isRTL ? "ص" : "AM");
      const hh = h % 12 || 12;
      return `${hh}:${m.toString().padStart(2, "0")} ${period}`;
    };

    const fTime = formatTime(time);

    // Simplified for a cleaner look
    return isRTL
      ? `${dayName}، الساعة ${fTime}`
      : `${dayName} at ${fTime}`;
  }, [salon.isOpen, salon.nextOpening, t, isRTL]);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="
        w-full
        rounded-[20px] bg-white p-5
        shadow-[0px_8px_32px_0px_#00000014]
        flex flex-col gap-2
      "
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col">
              {showTitle && (
                <span className="text-[12px] font-semibold text-[#111827] mb-1 text-start" dir="auto">
                  {t("bookingDetails.salonDetails.title")}
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <h1 dir={isRTL ? "rtl" : "auto"} className="flex-1 text-start text-[22px] md:text-[26px] font-bold leading-tight text-[#111827] break-words">
                  {salon.name}
                </h1>

                {isAuthenticated && (showFavorite || showChat) && (
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    {showFavorite && (
                      <button
                        type="button"
                        onClick={handleFavoriteClick}
                        aria-label={t("common.favorite")}
                        className="h-9 w-9 rounded-full bg-[#FDECEA] flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        <Heart
                          className={cn("h-4 w-4", isFavorited ? "fill-[#E53935] text-[#E53935]" : "text-[#E53935]")}
                          strokeWidth={1.5}
                        />
                      </button>
                    )}

                    {showChat && (
                      <Link
                        href={`/chat/${salon.id}`}
                        aria-label={t("chat.withSalon")}
                        className="h-9 w-9 rounded-full bg-[#E8F4FD] flex items-center justify-center hover:opacity-90 text-[#2D9CDB] transition-opacity"
                      >
                        <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                      </Link>
                    )}
                  </div>
                 )}
              </div>
            </div>

            {salon.description && (
              <p dir={isRTL ? "rtl" : "auto"} className="mt-2 text-sm text-[#BABABA] line-clamp-2 leading-relaxed text-start">
                {salon.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-6 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm bg-orange-50 px-2 py-1 rounded-lg">
              <Star className="h-3.5 w-3.5 fill-[#ED9526] text-[#ED9526]" />
              <span className="font-bold text-[#212121]">
                {salon.rating?.toFixed(1)}
              </span>
              <span className="text-[#2D9CDB] text-xs">({salon.reviews})</span>
            </div>

            {(salon.servesMen || salon.servesWomen) && (
              <div className="flex items-center gap-1.5">
                {salon.servesMen && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#2D9CDB] shadow-sm">
                    <Mars className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </span>
                )}
                {salon.servesWomen && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#CB30E0] shadow-sm">
                    <Venus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm transition-colors",
                salon.isOpen ? "bg-[#E6F4EA] text-[#27AE60]" : "bg-[#FDECEA] text-[#E53935]"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  salon.isOpen ? "bg-[#27AE60]" : "bg-[#E53935]"
                )}
              >
                <Clock className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </div>
              <span className="leading-none">{openLabel}</span>
            </span>

            {!salon.isOpen && nextOpeningMessage && (
              <span className="flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-slate-200/50 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] animate-pulse" />
                <span className="opacity-60">{isRTL ? "يفتح" : "Opens"}:</span>
                <span className="text-slate-700">{nextOpeningMessage}</span>
              </span>
            )}

            {inputLabel && (
              <span className="inline-flex items-center justify-center rounded-full px-3 py-1.5 bg-[#E8F4FD] text-[#2D9CDB] text-[11px] font-bold shadow-sm">
                {inputLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="truncate flex-1">{salon.location ?? ""}</span>
        </div>
      </div>
    </div>
  );
}
