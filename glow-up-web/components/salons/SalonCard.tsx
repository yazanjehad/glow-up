"use client";

import { SalonUi, looksLikeDbId } from "@/integration/services/provider/provider.types";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useTranslation } from "react-i18next";

function toText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null && "name" in v) {
    const n = (v as { name?: unknown }).name;
    return typeof n === "string" ? n : toText(n);
  }
  return String(v);
}

type SalonCardProps = {
  salon: SalonUi;
  showFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

const SalonCard = ({
  salon,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite,
}: SalonCardProps) => {
  const { goToSalon } = useNavigationFlow();
  const { i18n } = useTranslation();
  const isRTL = (i18n.language || "").toLowerCase().startsWith("ar");
  const name = toText(salon.name);
  const category = toText(salon.category);
  const description = toText(salon.description);
  const location = toText(salon.location);

  return (
    <div
      onClick={() => goToSalon(salon.id)}
      className="flex flex-col w-full flex-1 h-full min-h-[280px] bg-white border border-gray-200 rounded-[20px] overflow-hidden shadow-[0px_8px_32px_0px_#00000014] backdrop-blur-sm transition-all duration-300 ease-in-out scroll-snap-start cursor-pointer hover:-translate-y-1 hover:shadow-[0px_12px_40px_0px_rgba(0,0,0,0.1)]"
    >
      <div className={`relative w-full h-[136px] overflow-hidden rounded-t-[20px] flex-shrink-0 flex items-center justify-center ${
        !salon.coverImage || salon.coverImage === "/No image available.png" ? "bg-[#fcfcfc] border-b border-gray-50" : "bg-gray-100"
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={salon.coverImage || "/No image available.png"}
          alt={name}
          className={`transition-all duration-300 ease-in-out ${
            !salon.coverImage || salon.coverImage === "/No image available.png" 
              ? "h-[70%] w-auto object-contain opacity-40" 
              : "w-full h-full object-cover"
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/No image available.png";
            target.className = "h-[70%] w-auto object-contain opacity-40 transition-all duration-300 ease-in-out";
            if (target.parentElement) {
              target.parentElement.className = "relative w-full h-[136px] overflow-hidden rounded-t-[20px] flex-shrink-0 flex items-center justify-center bg-[#fcfcfc] border-b border-gray-50";
            }
          }}
        />

        {showFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite && onToggleFavorite();
            }}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md"
            aria-label="toggle favorite"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 transition-colors"
              fill={isFavorite ? "#ef4444" : "none"}
              stroke={isFavorite ? "#ffffff" : "#9ca3af"}
              strokeWidth="2"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        )}
      </div>

      <div
        className="p-3 px-4 flex flex-col gap-[10px] flex-grow"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div>
          <h3
            dir={isRTL ? "rtl" : "auto"} 
            className="font-medium text-base leading-5 text-gray-800 m-0 mb-[4px] line-clamp-1 text-start"
          >
            {name}
          </h3>

          <p
            dir="auto"
            className="font-normal text-xs leading-4 text-[#bababa] m-0 line-clamp-2 text-start"
            style={{ fontFamily: "'DIN Next LT Arabic', sans-serif" }}
          >
            {description}
          </p>
        </div>

        <div className="w-full border-t border-gray-100/50"></div>

        <div className="flex justify-between items-center" dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex items-center gap-[6px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/star.png" alt="star" className="w-4 h-4" />
            <span className="font-bold text-sm">{salon.rating ?? 0}</span>
            <span className="text-[#3b82f6] text-xs">({salon.reviews ?? 0})</span>

            <div className="flex gap-1">
              {salon.servesMen && (
                <div className="w-5 h-5 rounded-[4px] flex items-center justify-center bg-white border border-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/men.png" alt="male" className="w-3 h-3" />
                </div>
              )}
              {salon.servesWomen && (
                <div className="w-5 h-5 rounded-[4px] flex items-center justify-center bg-white border border-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/women.png" alt="female" className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>

          {!looksLikeDbId(category) && category && (
            <div className="bg-[#e0f2fe] max-w-[180px] w-fit h-[22px] px-2 rounded-[6px] flex items-center justify-center text-[0.7rem] font-semibold text-[#0ea5e9] whitespace-nowrap overflow-hidden">
              <span dir="auto" className="truncate w-full text-center">
                {category}
              </span>
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-[10px] text-[#6b7280] text-[0.85rem] mt-auto"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/location.png" alt="location" />
          <span dir="auto" className="text-start">
            {location}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalonCard;
