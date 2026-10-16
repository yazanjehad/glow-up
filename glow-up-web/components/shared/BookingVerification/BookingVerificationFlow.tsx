"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneVerificationStart from "../phoneVerificationStart";
import { OtpInput } from "../OtpInput";
import { NameRegistration } from "../NameRegistration";
import { authServices } from "@/integration/services/auth/authServices";
import { ProfileDto } from "@/integration/services/auth/auth.types";
import { useTranslation } from "react-i18next";

type Step = "phone" | "otp" | "register";

export default function BookingVerification({
  onVerified,
}: {
  onVerified?: () => Promise<void>;
}) {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpError, setOtpError] = useState<string | undefined>();
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [, setOtpVerified] = useState(false);
  const [showRequestNewOtp, setShowRequestNewOtp] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleRequestOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return setOtpError("Phone number is required");

    try {
      const res = await authServices.requestOTP({ phone: trimmedPhone });
      if (!res) throw new Error("Failed to send OTP");
      setOtpVerified(false);
      setStep("otp");
      setOtpError(undefined);
      setShowRequestNewOtp(false);
    } catch (err) {
      setOtpError(t("otpPage.errorSend"));
    }
  };

  const handleRequestNewOtp = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return;
    setOtpError(undefined);
    setShowRequestNewOtp(false);
    setResendLoading(true);
    try {
      const res = await authServices.requestOTP({ phone: trimmedPhone });
      if (!res) throw new Error("Failed to send OTP");
    } catch {
      setOtpError(t("otpPage.errorSend"));
    } finally {
      setResendLoading(false);
    }
  };

  const getOtpErrorMessage = (serverMessage: string): string => {
    if (!serverMessage) return t("otpPage.errorInvalid");
    const lower = serverMessage.toLowerCase();
    if (lower.includes("expired") || lower.includes("انتهت")) return t("otpPage.errorExpired");
    if (/too many|many attempts/i.test(serverMessage) || lower.includes("كبير جداً")) return t("otpPage.errorTooManyAttempts");
    const attemptsMatch = serverMessage.match(/attempts?\s*left[:\s]*(\d+)/i) || serverMessage.match(/(\d+)\s*attempts/i);
    if (attemptsMatch) return t("otpPage.errorInvalidAttempts", { count: parseInt(attemptsMatch[1], 10) });
    if (lower.includes("not a provider") || lower.includes("ليس مزود")) return t("otpPage.errorUserNotProvider");
    return serverMessage;
  };

  const handleOtpComplete = async (code: string) => {
    const trimmedCode = code.trim();
    if (!trimmedCode) return setOtpError(t("otpPage.errorRequired"));
    if (trimmedCode.length !== 4) return setOtpError(t("otpPage.errorLength"));
    if (!/^\d+$/.test(trimmedCode)) return setOtpError(t("otpPage.errorDigits"));

    try {
      const res = await authServices.verifyOTP({ phone, code: trimmedCode });

      if (res.nextAction === "LOGIN" && res.accessToken) {
        setOtpVerified(true);
        if (onVerified) {
          await onVerified();
        } else {
          router.replace("/booking-success");
        }
        return;
      }

      if (res.nextAction === "CREATE_ACCOUNT" && res.otpToken) {
        setOtpToken(res.otpToken);
        setStep("register");
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || "";
      setOtpError(getOtpErrorMessage(serverMessage));
      setOtpVerified(false);
      const lower = (serverMessage || "").toLowerCase();
      if (lower.includes("expired") || lower.includes("انتهت") || /too many|many attempts/i.test(serverMessage) || lower.includes("كبير جداً")) {
        setShowRequestNewOtp(true);
      }
    }
  };

  const handleRegisterComplete = async (data: ProfileDto) => {
    if (!otpToken) {
      setOtpError(t("otpPage.otpTokenMissing"));
      return;
    }
    setOtpError(undefined);

    try {
      await authServices.createCustomerProfile(data, otpToken);
      if (onVerified) {
        await onVerified();
      } else {
        router.replace("/booking-success");
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || "Failed to create profile");
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      {step === "phone" && (
        <PhoneVerificationStart
          phone={phone}
          setPhone={setPhone}
          onNext={handleRequestOtp}
        />
      )}

      {step === "otp" && (
        <OtpInput
          phone={phone}
          error={otpError}
          onComplete={handleOtpComplete}
          showRequestNewOtp={showRequestNewOtp}
          onRequestNewOtp={handleRequestNewOtp}
          requestNewOtpLoading={resendLoading}
        />
      )}

      {step === "register" && otpToken && (
        <NameRegistration
          phone={phone}
            isImg={false}
          onComplete={handleRegisterComplete}
        />
      )}
    </div>
  );
}
