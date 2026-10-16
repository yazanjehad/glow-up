"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

interface OtpInputProps {
  phone: string;
  onComplete: (otp: string) => void;
  error?: string;
  showRequestNewOtp?: boolean;
  onRequestNewOtp?: () => void;
  requestNewOtpLoading?: boolean;
}

export function OtpInput({
  phone,
  onComplete,
  error,
  showRequestNewOtp,
  onRequestNewOtp,
  requestNewOtpLoading,
}: OtpInputProps) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (otp.length === 4) {
      onComplete(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleVerifyClick = () => {
    onComplete(otp);
  };

  return (
    <div className="pt-6 pb-5 flex flex-col items-center text-center">
      <div className="text-lg font-semibold text-gray-900">
        {t("otpPage.title")}
      </div>

      <div className="mt-2 text-sm text-gray-500">
        <div>{t("otpPage.subtitlePrefix")}</div>
        <div className="text-button-green font-medium">{phone}</div>
      </div>

      <div className="mt-6 flex flex-col items-center w-full min-w-0 overflow-visible">
        <div dir="ltr" className="flex justify-center overflow-visible">
          <InputOTP
            value={otp}
            onChange={setOtp}
            maxLength={4}
            aria-label={t("otpPage.otpAria")}
            autoFocus
            containerClassName="gap-2 sm:gap-3"
          >
            <InputOTPGroup className="gap-2 sm:gap-3 min-w-[min(100%,theme(spacing.52))] justify-center flex-wrap">
              <InputOTPSlot
                index={0}
                className={`min-w-[2.5rem] w-10 h-12 sm:w-12 sm:h-12 rounded-lg border border-gray-200 data-[active=true]:border-button-green ${error ? "border-red-500" : ""}`}
              />
              <InputOTPSlot
                index={1}
                className={`min-w-[2.5rem] w-10 h-12 sm:w-12 sm:h-12 rounded-lg border border-gray-200 data-[active=true]:border-button-green ${error ? "border-red-500" : ""}`}
              />
              <InputOTPSlot
                index={2}
                className={`min-w-[2.5rem] w-10 h-12 sm:w-12 sm:h-12 rounded-lg border border-gray-200 data-[active=true]:border-button-green ${error ? "border-red-500" : ""}`}
              />
              <InputOTPSlot
                index={3}
                className={`min-w-[2.5rem] w-10 h-12 sm:w-12 sm:h-12 rounded-lg border border-gray-200 data-[active=true]:border-button-green ${error ? "border-red-500" : ""}`}
              />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 text-center px-1">{error}</div>}
        <Button
          type="button"
          onClick={handleVerifyClick}
          disabled={requestNewOtpLoading}
          className="mt-5 w-full max-w-[200px] h-11 rounded-lg bg-button-green hover:bg-button-green/90 text-white disabled:opacity-50"
        >
          {requestNewOtpLoading ? t("loading") : t("otpPage.verifyButton")}
        </Button>
        {showRequestNewOtp && onRequestNewOtp && (
          <button
            type="button"
            onClick={onRequestNewOtp}
            disabled={requestNewOtpLoading}
            className="mt-4 text-button-green font-medium text-sm hover:underline disabled:opacity-50"
          >
            {requestNewOtpLoading ? t("loading") : t("otpPage.requestNewOtp")}
          </button>
        )}
      </div>
    </div>
  );
}
