"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { Phone } from "lucide-react";
import { AdminAuthService } from "@/integration/services/admin/adminAuth.service";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function isValidPhone(phone: string) {
  return /^\d{10}$/.test(phone.trim());
}

type Step = "PHONE" | "OTP";

export default function AdminLoginPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [step, setStep] = useState<Step>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Match customer/provider behavior: enable submit when length is exactly 10 digits.
  const canSubmitPhone = useMemo(() => isValidPhone(phone), [phone]);
  const canSubmitOtp = otp.trim().length === 4;

  // Auto-submit OTP when all 4 digits are entered
  useEffect(() => {
    if (otp.trim().length === 4 && !loading) {
      handleOtpComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const backToPhone = () => {
    setStep("PHONE");
    setOtp("");
    setError("");
  };

  const onSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = phone.trim();
    if (trimmed.length !== 10) {
      setError(t("signupPage.errorPhoneLength"));
      return;
    }

    if (!trimmed.startsWith("05")) {
      setError(t("signupPage.errorPhoneStart"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      await AdminAuthService.requestOTP(trimmed);
      setError("");
      setStep("OTP");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || t("adminLogin.errorOtpFailed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = async () => {
    const trimmedCode = otp.trim();

    setError("");
    setLoading(true);

    try {
      await AdminAuthService.loginWithOTP({
        phone: phone.trim(),
        code: trimmedCode,
      });

      // Redirect to super-admin portal (allow any successful login)
      router.push("/super-admin-dashboard");
    } catch (err: any) {
      let errorMessage = t("adminLogin.errorLoginFailed");

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status === 400) {
        errorMessage = t("adminLogin.errorInvalidOtp");
      } else if (err?.response?.status === 404) {
        errorMessage = t("adminLogin.errorPhoneNotFound");
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const next = isRTL ? "en" : "ar";
    i18n.changeLanguage(next);
    document.documentElement.setAttribute(
      "dir",
      next.startsWith("ar") ? "rtl" : "ltr",
    );
    document.documentElement.setAttribute("lang", next);
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Language Switcher */}
      <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} z-50`}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="h-9 px-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-[13px] font-semibold text-[#111]"
          aria-label={isRTL ? t("header.languageEn") : t("header.languageAr")}
        >
          {isRTL ? "EN" : "AR"}
        </button>
      </div>

      <div className="w-full max-w-[420px]">
        {step === "OTP" ? (
          // OTP Step
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-7">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={backToPhone}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label={t("adminLogin.back")}
              >
                {isRTL ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                )}
              </button>

              <div className="text-center flex-1">
                <div className="text-[16px] font-semibold text-gray-900">
                  {t("adminLogin.title")}
                </div>
              </div>

              <div className="h-9 w-9" />
            </div>

            <div className="mt-6 text-center">
              <div className="text-[16px] font-semibold text-gray-900">
                {t("adminLogin.otpTitle")}
              </div>

              <div className="mt-2 text-[13px] text-gray-500">
                <span>{t("adminLogin.otpSentTo")}</span>{" "}
                <span className="text-button-green font-medium">{phone}</span>
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center">
              <div dir="ltr">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={4}
                  aria-label={t("adminLogin.otpAria")}
                  autoFocus
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <InputOTPSlot
                        key={idx}
                        index={idx}
                        className={[
                          "h-12 w-12 rounded-[10px] border border-gray-200",
                          "data-[active=true]:border-button-green",
                          error ? "border-red-500" : "",
                        ].join(" ")}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

              <button
                type="button"
                disabled={!canSubmitOtp || loading}
                onClick={handleOtpComplete}
                className={[
                  "mt-7 w-full h-12 rounded-xl text-[14px] font-semibold transition",
                  canSubmitOtp && !loading
                    ? "bg-button-green text-white hover:bg-button-green/90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                {loading ? t("adminLogin.loading") : t("adminLogin.next")}
              </button>
            </div>
          </div>
        ) : (
          // Phone Step
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-7">
            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/provider-login.jpeg"
                alt="admin login"
                width={100}
                height={100}
                className="h-auto w-[100px]"
                priority
              />
            </div>

            {/* Welcome Text */}
            <div className="mt-5 text-center">
              <h2 className="text-[18px] font-semibold text-gray-900">
                {t("adminLogin.welcomeTitle")}
              </h2>
              <p className="mt-1 text-[13px] text-gray-500">
                {t("adminLogin.welcomeSubtitle")}
              </p>
            </div>

            {/* Phone Form */}
            <form className="mt-6" onSubmit={onSubmitPhone}>
              <label className="mb-2 block text-[13px] text-gray-500">
                {t("adminLogin.phoneLabel")} <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  value={phone}
                  onChange={(e) => {
                    setError("");
                    // Keep only digits and limit to 10.
                    setPhone(digitsOnly(e.target.value).slice(0, 10));
                  }}
                  type="tel"
                  inputMode="numeric"
                  placeholder={t("adminLogin.phonePlaceholder")}
                  maxLength={10}
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

              {error && (
                <p className="mt-2 text-[13px] text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={!canSubmitPhone || loading}
                className={`mt-5 w-full h-12 rounded-xl text-[14px] font-semibold transition ${
                  canSubmitPhone && !loading
                    ? "bg-button-green text-white hover:bg-button-green/90"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? t("adminLogin.loading") : t("adminLogin.next")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
