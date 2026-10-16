"use client";

import { useTranslation } from "react-i18next";

export default function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-[#7BAE6A]" : "bg-gray-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked
            ? isRTL
              ? "left-1"
              : "right-1"
            : isRTL
              ? "right-1"
              : "left-1"
        }`}
      />
    </button>
  );
}
