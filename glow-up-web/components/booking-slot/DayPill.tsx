"use client";

import { useTranslation } from "react-i18next";
import type { DayItem } from "../../app/models/booking-slot-types";

type Props = {
  item: DayItem;
  isSelected: boolean;
  onSelect?: (id: string) => void;
};

export default function DayPill({ item, isSelected, onSelect }: Props) {
  const { t } = useTranslation();
  const disabled = item.status === "unavailable";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect?.(item.id)}
      className={[
        "shrink-0",
        "flex h-20 w-14 flex-col items-center pt-3 rounded-full border-2",
        "transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:brightness-95 active:brightness-90",


        item.status === "unavailable"
          ? "bg-white border-[#E53935]"
          : isSelected
            ? "bg-[#27AE60] border-[#27AE60]"
            : "bg-white border-[#D1D5DB]",
      ].join(" ")}
      aria-label={`${t(`days.${item.dayKey}`)} ${item.date}`}
    >
      <div
        className={[
          "grid h-8 w-8 place-items-center rounded-full",
          "text-xs font-semibold",

          item.status === "unavailable"
            ? "bg-[#FDECEA] text-[#E53935]"
            : isSelected
              ? "bg-white text-[#27AE60]"
              : "bg-[#D1D5DB] text-white",
        ].join(" ")}
      >
        {item.date}
      </div>

      <div
        className={[
          "mt-2 w-12 truncate text-[8px] leading-none text-center",

          item.status === "unavailable"
            ? "text-[#E53935]"
            : isSelected
              ? "text-white"
              : "text-slate-500",
        ].join(" ")}
      >
        {t(`days.${item.dayKey}`)}
      </div>
    </button>
  );
}
