"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OtpInputProps {
  phone: string;
  onComplete: (otp: string) => void;
  onBack?: () => void;
  error?: string;
  loading?: boolean;
}

export function OtpInput({
  phone,
  onComplete,
  onBack,
  error,
  loading = false,
}: OtpInputProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [otp, setOtp] = useState("");

  const canSubmit = useMemo(() => otp.trim().length === 4, [otp]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label={t("otpPage.backAria")}
        >
          {isRTL ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          )}
        </button>

        <div className="text-center flex-1">
          <div className="text-[16px] font-semibold text-gray-900">
            {t("otpPage.topBarTitle") }
          </div>
        </div>

        <div className="h-9 w-9" />
      </div>

      <div className="mt-6 text-center">
        <div className="text-[16px] font-semibold text-gray-900">
          {t("otpPage.title") }
        </div>

        <div className="mt-2 text-[13px] text-gray-500">
          <span>{t("otpPage.subtitlePrefix")}</span>{" "}
          <span className="text-button-green font-medium">{phone}</span>
        </div>
      </div>

      <div className="mt-7 flex flex-col items-center w-full min-w-0 overflow-visible">
        <div dir="ltr" className="flex justify-center overflow-visible">
          <InputOTP
            value={otp}
            onChange={setOtp}
            maxLength={4}
            aria-label={t("otpPage.otpAria")}
            autoFocus
            containerClassName="gap-2 sm:gap-3"
          >
            <InputOTPGroup className="gap-2 sm:gap-3 justify-center flex-wrap min-w-0">
              {[0, 1, 2, 3].map((idx) => (
                <InputOTPSlot
                  key={idx}
                  index={idx}
                  className={[
                    "min-w-[2.5rem] w-10 h-12 sm:w-12 sm:h-12 rounded-[10px] border border-gray-200",
                    "data-[active=true]:border-button-green",
                    error ? "border-red-500" : "",
                  ].join(" ")}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && <div className="mt-3 text-sm text-red-600 text-center px-1">{error}</div>}

        <button
          type="button"
          disabled={!canSubmit || loading}
          onClick={() => onComplete(otp.trim())}
          className={[
            "mt-7 w-full max-w-[520px] h-12 rounded-xl text-[14px] font-semibold transition",
            canSubmit && !loading
              ? "bg-button-green text-white hover:bg-button-green/90"
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          {loading ? t("loading") : t("next")}
        </button>
      </div>
    </div>
  );
}
