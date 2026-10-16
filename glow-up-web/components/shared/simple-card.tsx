"use client";

import { useTranslation } from "react-i18next";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { User, Gift } from "lucide-react";

interface SimpleCardProps {
  titleKey: string;
  descriptionKey: string;
  iconType: "user" | "gift";
  onClick?: () => void;
}

export function SimpleCard({
  titleKey,
  descriptionKey,
  iconType,
  onClick,
}: SimpleCardProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const Icon = iconType === "user" ? User : Gift;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-between gap-4 p-4
        border border-gray-200 rounded-2xl
        hover:bg-gray-50 transition-colors w-full flex-row
      `}
    >
      {/* Content */}
      <div
        className={`
          flex items-center gap-3 flex-1
          ${isRTL ? "text-right" : "text-left"}
        `}
      >
        {/* Text */}
        <div className="bg-green-50 rounded-full p-2.5 flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <div className="font-semibold text-gray-800">{t(titleKey)}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {t(descriptionKey)}
          </div>
        </div>
      </div>

      {/* Arrow */}
      <ChevronArrow />
    </button>
  );
}
