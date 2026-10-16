"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Phone } from "lucide-react";

import { OtpInput } from "@/app/provider/provider-login/OtpInput";
import { NameRegistration } from "@/components/shared/NameRegistration";
import { authServices } from "@/integration/services/auth/authServices";
import type { ProfileDto } from "@/integration/services/auth/auth.types";
import { useProviderStore } from "@/store/providerStore";

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone.trim());
}

type Step = "PHONE" | "OTP" | "NAME";

export default function SignupPhonePage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [step, setStep] = useState<Step>("PHONE");
  const [phone, setPhone] = useState("");

  const [otpError, setOtpError] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setOtpVerified] = useState(false);

  const canSubmitPhone = useMemo(() => isValidPhone(phone), [phone]);

  const backToPhone = () => {
    setStep("PHONE");
    setOtpToken(null);
    setOtpVerified(false);
    setOtpError("");
    setPhone("");
  };

  const onSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = phone.trim();
    if (!isValidPhone(trimmed)) {
      setOtpError("رقم الهاتف غير صحيح");
      return;
    }

    setLoading(true);
    try {
      const ok = await authServices.requestOTP({ phone: trimmed });
      if (!ok) throw new Error("Failed to send OTP");

      setOtpError("");
      setStep("OTP");
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = async (code: string) => {
    const trimmedCode = code.trim();

    if (trimmedCode !== "1234") {
      setOtpError(t("otpPage.errorInvalid"));
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      const res = await authServices.verifyProviderOTP({
        phone: phone.trim(),
        code: trimmedCode,
      });

      if (!res) throw new Error("Failed to verify OTP");

      // LOGIN
      if (res.nextAction === "LOGIN" && res.accessToken) {
        const providerId = localStorage.getItem("providerId") || "";

        if (!providerId) {
          setOtpError("مشكلة: ما قدرنا نجيب providerId");
          return;
        }

        useProviderStore.getState().setProviderId(providerId);
        router.push("/admin-dashboard");
        return;
      }

      // CREATE_ACCOUNT
      if (res.nextAction === "CREATE_ACCOUNT" && res.otpToken) {
        setOtpToken(res.otpToken);

        router.push(
          `/provider/provider-profile?phone=${encodeURIComponent(
            phone.trim(),
          )}&token=${encodeURIComponent(res.otpToken)}`,
        );
        return;
      }

      setOtpError(t("error"));
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || "";
      const lower = (serverMessage || "").toLowerCase();
      if (lower.includes("expired") || lower.includes("انتهت")) setOtpError(t("otpPage.errorExpired"));
      else if (/too many|many attempts/i.test(serverMessage) || lower.includes("كبير جداً")) setOtpError(t("otpPage.errorTooManyAttempts"));
      else if (lower.includes("not a provider") || lower.includes("ليس مزود")) setOtpError(t("otpPage.errorUserNotProvider"));
      else {
        const attemptsMatch = serverMessage.match(/attempts?\s*left[:\s]*(\d+)/i) || serverMessage.match(/(\d+)\s*attempts/i);
        if (attemptsMatch) setOtpError(t("otpPage.errorInvalidAttempts", { count: parseInt(attemptsMatch[1], 10) }));
        else setOtpError(serverMessage || t("otpPage.errorInvalid"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameComplete = async (data: ProfileDto) => {
    if (!otpToken) {
      setOtpError(t("otpPage.otpTokenMissing"));
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      await authServices.createCustomerProfile(data, otpToken);
      router.push("/home");
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      <div className="mx-auto w-full max-w-[420px]">
        {step === "NAME" ? (
          <NameRegistration
            phone={phone}
            isImg
            onComplete={handleNameComplete}
          />
        ) : step === "OTP" ? (
          <OtpInput
            phone={phone}
            onComplete={handleOtpComplete}
            error={otpError}
            onBack={backToPhone}
            loading={loading}
          />
        ) : (
          <>
            <h1 className="text-center text-[18px] font-semibold text-gray-900">
              {t("signUp")}
            </h1>

            <div className="mt-6 flex justify-center">
              <Image
                src="/provider-login.jpeg"
                alt="signup"
                width={100}
                height={100}
                className="h-auto w-[100px]"
                priority
              />
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-[18px] font-semibold text-gray-900">
                {t("signupPage.welcomeTitle")}
              </h2>
              <p className="mt-1 text-[13px] text-gray-500">
                {t("signupPage.welcomeSubtitle")}
              </p>
            </div>

            <form className="mt-6" onSubmit={onSubmitPhone}>
              <label className="mb-2 block text-[13px] text-gray-500">
                {t("signupPage.phoneLabel")}{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  value={phone}
                  maxLength={10}
                  onChange={(e) => {
                    setOtpError("");
                    setPhone(digitsOnly(e.target.value));
                  }}
                  type="tel"
                  inputMode="numeric"
                  placeholder={t("signupPage.phonePlaceholder")}
                  className={`w-full h-12 rounded-xl border border-gray-200 bg-white px-10 text-[14px] outline-none focus:border-button-green focus:ring-2 focus:ring-button-green/15 placeholder:text-gray-400 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                />

                <Phone
                  className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${
                    isRTL ? "left-3" : "right-3"
                  }`}
                />
              </div>

              {otpError && (
                <p className="mt-2 text-[13px] text-red-500">{otpError}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmitPhone || loading}
                className={`mt-5 w-full h-12 rounded-xl text-[14px] font-semibold transition
                  ${
                    canSubmitPhone && !loading
                      ? "bg-button-green text-white hover:bg-button-green/90"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {loading ? t("loading") : t("next")}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-4 w-full text-center text-[13px]"
              >
                <span className="text-gray-500">
                  {t("signupPage.haveAccount")}{" "}
                </span>
                <span className="font-medium text-button-green">
                  {t("login")}
                </span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
