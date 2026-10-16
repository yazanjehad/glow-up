"use client";

import type { TimeItem } from "../../app/models/booking-slot-types";

type Props = {
  item: TimeItem;
  isSelected: boolean;
  onSelect?: (id: string) => void;
};

export default function TimePill({ item, isSelected, onSelect }: Props) {
  const disabled = item.status === "unavailable" && !isSelected;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect?.(item.id)}
      className={[
        "w-full h-9 rounded-xl px-2",
        "text-[11px] font-medium leading-none",
        "flex items-center justify-center",
        "transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:brightness-95 active:brightness-90",

        isSelected
          ? "bg-[#E6F4EA] text-[#27AE60]"
          : item.status === "unavailable"
          ? "bg-[#FDECEA] text-[#E53935]"
          : "bg-[#E0E0E0] text-[#8B8A8A]",
      ].join(" ")}
    >
      {item.label}
    </button>
  );
}
