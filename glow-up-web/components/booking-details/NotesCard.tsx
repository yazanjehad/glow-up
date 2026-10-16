"use client";

import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
};

export default function NotesCard({ value, onChange, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="
        mx-auto w-full max-w-[681px] h-[124px]
        rounded-[24px] bg-white
        px-6 py-5
        shadow-[0px_12px_40px_0px_#00000014]
        flex flex-col justify-between
      "
    >
      <h2 className="text-[18px] text-gray-900">
        {t("bookingDetails.notes.title")}
      </h2>

      <div
        className="
          flex items-center gap-[10px]
          w-full max-w-[633px]
          h-[48px] min-h-[48px]
          px-[14px] py-[10px]
          rounded-[20px]
          bg-white
          border border-[#E0E0E0]
        "
      >
        <textarea
          value={value}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={t("bookingDetails.notes.placeholder")}
          rows={1}
          className="
            w-full bg-transparent
            resize-none outline-none
            text-[14px] text-[#8B8A8A]
            leading-[28px]
            placeholder:text-[#8B8A8A]
          "
        />
      </div>
    </div>
  );
}
