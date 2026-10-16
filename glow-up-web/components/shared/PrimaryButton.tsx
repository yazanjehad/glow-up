"use client";

import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export default function PrimaryButton({
  children,
  className,
  disabled,
  fullWidth = true,
  ...rest
}: Props) {
  return (
    <button
      disabled={disabled}
      className={[
        fullWidth ? "w-full" : "",
        "h-12 rounded-2xl text-sm font-semibold transition",
        disabled
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-[#7AA66A] text-white hover:opacity-95",
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
