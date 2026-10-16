"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onNext: () => void;
  phone: string;
  setPhone: (value: string) => void;
};

export default function PhoneVerificationStart({
  onNext,
  phone,
  setPhone,
}: Props) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    
    if (!p) {
      setError(t("welcomeModal.phoneRequired"));
      return;
    }

    if (p.length !== 10) {
      setError(t("welcomeModal.phoneInvalid"));
      return;
    }

    if (!p.startsWith("05")) {
      setError(t("welcomeModal.phoneStartInvalid"));
      return;
    }

    if (!/^\d+$/.test(p)) {
      setError(t("welcomeModal.phoneDigitsOnly"));
      return;
    }

    setError("");
    onNext();
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      <div className="w-full p-4 max-h-[50vh] overflow-y-auto">
        <div className="mt-5 text-center">
          <div className="text-[24px] font-semibold text-[#111827]">
            {t("welcomeModal.title")}
          </div>
          <div className="mt-1 text-[16px] text-[#4B5563]">
            {t("welcomeModal.subtitle")}
          </div>
        </div>

        <form className="mt-6 w-full" onSubmit={onSubmit}>
          <label
            className={`mb-2 block text-sm text-gray-700 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {t("welcomeModal.phoneLabel")}{" "}
            <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              value={phone}
              maxLength={10}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ""); // Only digits
                if (val.length <= 10) {
                  setPhone(val);
                }
                if (error) setError("");
              }}
              placeholder={t("welcomeModal.phonePlaceholder")}
              className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none placeholder:text-gray-400 focus:ring-2 ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-200 focus:border-button-green focus:ring-button-green/20"
              } ${isRTL ? "text-right" : "text-left"}`}
            />

            <User
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 ${
                isRTL ? "right-4" : "left-4"
              }`}
            />
          </div>

          {error && (
            <p
              className={`mt-2 text-xs text-red-500 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="mt-6 h-12 w-full rounded-lg bg-button-green text-white hover:bg-button-green/90"
          >
            {t("welcomeModal.next")}
          </Button>
        </form>
      </div>
    </div>
  );
}
