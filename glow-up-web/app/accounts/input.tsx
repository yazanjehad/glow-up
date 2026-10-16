"use client";

import React, { InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  placeholder?: string;

  placeholderColor?: string;
  icon?: React.ReactNode;

  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
};

export default function Input({
  label,
  placeholder,
  placeholderColor = "placeholder:text-gray-300",
  type = "text",
  icon,
  containerClassName = "",
  inputClassName = "",
  labelClassName = "",
  id,
  ...rest
}: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className={`w-full ${containerClassName}`}>
      {label ? (
        <div className={`mb-2 text-xs text-gray-400 ${labelClassName}`}>
          {label}
        </div>
      ) : null}

      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={[
            "w-full h-[44px] rounded-full bg-white",
            "border border-gray-200",
            "shadow-[0_10px_18px_-14px_rgba(0,0,0,0.35)]",
            "px-5 text-sm text-gray-700 outline-none transition",
            "focus:border-gray-300 focus:ring-2 focus:ring-gray-100",

            icon ? (isRTL ? "pr-12" : "pl-12") : "",

            placeholderColor,

            inputClassName,
          ].join(" ")}
          {...rest}
        />
        {icon ? (
          <div
            className={[
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-300",
              isRTL ? "right-4" : "left-4",
            ].join(" ")}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
