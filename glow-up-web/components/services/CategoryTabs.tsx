"use client";

import { useTranslation } from "react-i18next";

type Props = {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
};

export default function CategoryTabs({ categories, active, onChange }: Props) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full items-center gap-2 overflow-x-auto px-4 py-1"
    >
      {categories.map((category) => {
        const isActive = category === active;

        return (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`flex-shrink-0 whitespace-nowrap rounded-[10px] px-4 py-2 text-[13px] font-medium transition
              ${
                isActive
                  ? "bg-[#7BAE6A] text-white"
                  : "bg-white text-[#BABABA] ring-1 ring-gray-300 hover:bg-gray-50"
              }`}
          >
            {t(`categories.${category}`, {
              defaultValue: category,
            })}
          </button>
        );
      })}
    </div>
  );
}
