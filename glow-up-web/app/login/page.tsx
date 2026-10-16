"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import Image from "next/image";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopBar } from "@/components/shared/TopBar";
import { OtpInput } from "@/components/shared/OtpInput";
import { NameRegistration } from "@/components/shared/NameRegistration";
import { authServices } from "@/integration/services/auth/authServices";
import { ProfileDto } from "@/integration/services/auth/auth.types";
import { useProviderStore } from "@/store/providerStore";

type LoginType = "user" | "salon";

export default function LoginPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [phone, setPhone] = useState("");
  const [loginType, setLoginType] = useState<LoginType>("user");
  const [showOtp, setShowOtp] = useState(false);
  const [showNameForm, setShowNameForm] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showRequestNewOtp, setShowRequestNewOtp] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "PROVIDER") {
        router.replace("/admin-dashboard/home");
      } else if (role === "EMPLOYEE") {
        router.replace("/admin-dashboard/orders");
      } else {
        router.replace("/home");
      }
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  const getOtpErrorMessage = (
    serverMessage: string,
  ): { message: string; showResend: boolean } => {
    if (!serverMessage) {
      return { message: t("otpPage.errorInvalid"), showResend: false };
    }

    const lower = serverMessage.toLowerCase();

    if (lower.includes("expired") || lower.includes("انتهت")) {
      return { message: t("otpPage.errorExpired"), showResend: true };
    }

    const tooMany =
      /too many|many attempts|\.\s*too many/i.test(serverMessage) ||
      lower.includes("كبير جداً");

    if (tooMany) {
      return {
        message: t("otpPage.errorTooManyAttempts"),
        showResend: true,
      };
    }

    const attemptsMatch =
      serverMessage.match(
        /attempts?\s*left[:\s]*(\d+)|المحاولات المتبقية[:\s]*(\d+)/i,
      ) || serverMessage.match(/(\d+)\s*(?:attempts|محاولات)/i);

    const count = attemptsMatch
      ? parseInt(attemptsMatch[1] || attemptsMatch[2] || "0", 10)
      : null;

    if (count !== null) {
      return {
        message: t("otpPage.errorInvalidAttempts", { count }),
        showResend: false,
      };
    }

    if (
      lower.includes("invalid otp") ||
      lower.includes("رمز التحقق غير صحيح")
    ) {
      return { message: t("otpPage.errorInvalid"), showResend: false };
    }

    if (lower.includes("not a provider") || lower.includes("ليس مزود")) {
      return {
        message: t("otpPage.errorUserNotProvider"),
        showResend: false,
      };
    }

    return { message: serverMessage, showResend: false };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setOtpError("Phone number is required");
      return;
    }

    if (trimmedPhone.length !== 10) {
      setOtpError(
        t("otpPage.errorPhoneLength") ||
        "Phone number must be exactly 10 digits",
      );
      return;
    }

    if (!trimmedPhone.startsWith("05")) {
      setOtpError(t("signupPage.errorPhoneStart"));
      return;
    }

    if (!/^\d+$/.test(trimmedPhone)) {
      setOtpError("Phone number must contain digits only");
      return;
    }

    try {
      setLoading(true);
      const res = await authServices.requestOTP({ phone: trimmedPhone });

      if (!res) {
        throw new Error("Failed to send OTP");
      }

      setOtpVerified(false);
      setShowOtp(true);
      setOtpError("");
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || "";

      if (serverMessage.includes("OTP already sent")) {
        const secondsMatch = serverMessage.match(/\d+/);
        const seconds = secondsMatch ? parseInt(secondsMatch[0], 10) : 60;
        setOtpError(t("otpPage.resendWait", { count: seconds }));
      } else {
        setOtpError(serverMessage || t("otpPage.errorSend"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setShowOtp(false);
    setShowNameForm(false);
    setPhone("");
    setOtpError("");
    setShowRequestNewOtp(false);
  };

  const handleRequestNewOtp = async () => {
    setOtpError("");
    setShowRequestNewOtp(false);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) return;

    try {
      setLoading(true);
      const res = await authServices.requestOTP({ phone: trimmedPhone });

      if (!res) {
        throw new Error("Failed to send OTP");
      }

      setOtpError("");
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || "";

      if (serverMessage.includes("OTP already sent")) {
        const secondsMatch = serverMessage.match(/\d+/);
        const seconds = secondsMatch ? parseInt(secondsMatch[0], 10) : 60;
        setOtpError(t("otpPage.resendWait", { count: seconds }));
      } else {
        setOtpError(serverMessage || t("otpPage.errorSend"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = async (code: string) => {
    if (otpVerified) return;

    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setOtpError(t("otpPage.errorRequired"));
      return;
    }

    if (trimmedCode.length !== 4) {
      setOtpError(t("otpPage.errorLength"));
      return;
    }

    if (!/^\d+$/.test(trimmedCode)) {
      setOtpError(t("otpPage.errorDigits"));
      return;
    }

    setOtpError("");
    setLoading(true);

    try {
      if (loginType === "user") {
        const res = await authServices.verifyOTP({
          phone: phone.trim(),
          code: trimmedCode,
        });

        if (res.nextAction === "LOGIN" && res.accessToken) {
          localStorage.setItem("accessToken", res.accessToken);
          localStorage.setItem("role", res.user?.role || "");

          if (res.user?.role === "PROVIDER") {
            router.replace("/admin-dashboard/home");
            return;
          }

          if (res.user?.role === "EMPLOYEE") {
            router.replace("/admin-dashboard/orders");
            return;
          }

          router.replace("/home");
          return;
        }

        if (
          (res.nextAction === "CREATE_ACCOUNT" ||
            res.nextAction === "COMPLETE_PROFILE") &&
          res.otpToken
        ) {
          setOtpToken(res.otpToken);
          setShowOtp(false);
          setShowNameForm(true);
          return;
        }

        setOtpVerified(true);
      } else {
        const res = await authServices.verifyProviderOTP({
          phone: phone.trim(),
          code: trimmedCode,
        });

        if (!res) {
          throw new Error("Failed to verify OTP");
        }

        if (res.nextAction === "LOGIN" && res.accessToken) {
          localStorage.setItem("accessToken", res.accessToken);
          localStorage.setItem("role", res.user?.role || "");

          const providerId = localStorage.getItem("providerId") || "";

          if (providerId) {
            useProviderStore.getState().setProviderId(providerId);
          }

          if (res.user?.role === "PROVIDER") {
            router.replace("/admin-dashboard/home");
          } else if (res.user?.role === "EMPLOYEE") {
            router.replace("/admin-dashboard/orders");
          }
          return;
        }

        if (res.nextAction === "CREATE_ACCOUNT" && res.otpToken) {
          setOtpToken(res.otpToken);
          router.replace(
            `/provider/provider-profile?phone=${encodeURIComponent(
              phone.trim(),
            )}&token=${encodeURIComponent(res.otpToken)}`,
          );
          return;
        }

        setOtpError(t("error"));
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || "";
      const { message, showResend } = getOtpErrorMessage(serverMessage);

      setOtpError(message);
      setShowRequestNewOtp(showResend);
      setOtpVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNameComplete = async (data: ProfileDto) => {
    if (!otpToken) {
      setOtpError(t("otpPage.otpTokenMissing"));
      return;
    }

    const errors: string[] = [];

    if (!data.firstname.trim()) errors.push("First name is required");
    if (!data.lastname.trim()) errors.push("Last name is required");
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Email is invalid");
    }
    if (data.password && data.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (!["MALE", "FEMALE"].includes(data.gender)) {
      errors.push("Gender must be MALE or FEMALE");
    }

    if (errors.length > 0) {
      setOtpError(errors.join(", "));
      return;
    }

    setOtpError("");

    try {
      setLoading(true);
      await authServices.createCustomerProfile(data, otpToken);
      router.replace("/home");
    } catch (err: any) {
      setOtpError(
        err?.response?.data?.message || t("loginPage.errorCreateProfile"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return null;

  return (
    <Layout>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-[calc(100vh-72px)] bg-gray-50"
      >
        <TopBar
          titleKey={
            showOtp
              ? "otpPage.topBarTitle"
              : loginType === "user"
                ? "signupPage.userTopBarTitle"
                : "signupPage.salonTopBarTitle"
          }
          iconHref={showOtp || showNameForm ? undefined : "/home"}
          onIconClick={showOtp || showNameForm ? handleBackToPhone : undefined}
          iconAriaLabelKey={
            showOtp || showNameForm ? "otpPage.backAria" : "signupPage.homeAria"
          }
          icon={
            showOtp || showNameForm ? (
              isRTL ? (
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
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )
            ) : undefined
          }
        />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-7">
              {showNameForm ? (
                <NameRegistration
                  phone={phone}
                  isImg={true}
                  onComplete={handleNameComplete}
                  error={otpError}
                />
              ) : showOtp ? (
                <OtpInput
                  phone={phone}
                  onComplete={handleOtpComplete}
                  error={otpError}
                  showRequestNewOtp={showRequestNewOtp}
                  onRequestNewOtp={handleRequestNewOtp}
                  requestNewOtpLoading={loading}
                />
              ) : (
                <Tabs
                  value={loginType}
                  onValueChange={(v) => setLoginType(v as LoginType)}
                >
                  <TabsList className="grid grid-cols-2 w-full bg-gray-100 rounded-full p-1 h-11">
                    {isRTL ? (
                      <>
                        <TabsTrigger
                          value="salon"
                          className="rounded-full text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("signupPage.tabSalon")}
                        </TabsTrigger>
                        <TabsTrigger
                          value="user"
                          className="rounded-full text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("signupPage.tabUser")}
                        </TabsTrigger>
                      </>
                    ) : (
                      <>
                        <TabsTrigger
                          value="user"
                          className="rounded-full text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("signupPage.tabUser")}
                        </TabsTrigger>
                        <TabsTrigger
                          value="salon"
                          className="rounded-full text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("signupPage.tabSalon")}
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>

                  <TabsContent value={loginType} className="mt-0">
                    <div className="pt-6 pb-5 flex flex-col items-center text-center">
                      <div className="w-[280px] max-w-full">
                        <Image
                          src="/signup-background.png"
                          alt={
                            loginType === "user"
                              ? t("signupPage.userTopBarTitle")
                              : t("signupPage.salonTopBarTitle")
                          }
                          width={720}
                          height={520}
                          className="w-full h-auto"
                          priority
                        />
                      </div>

                      <div className="mt-5">
                        <div className="text-lg font-semibold text-gray-900">
                          {t("signupPage.welcomeTitle")}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {t("signupPage.welcomeSubtitle")}
                        </div>
                      </div>

                      <form className="w-full mt-6" onSubmit={onSubmit}>
                        <label
                          className={`block text-sm text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"
                            }`}
                        >
                          {isRTL ? (
                            <>
                              <span className="text-red-500 ml-1">*</span>
                              {t("signupPage.phoneLabel")}
                            </>
                          ) : (
                            <>
                              {t("signupPage.phoneLabel")}
                              <span className="text-red-500 ml-1">*</span>
                            </>
                          )}
                        </label>

                        <div className="relative">
                          <input
                            value={phone}
                            maxLength={10}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(
                                /\D/g,
                                "",
                              );
                              setPhone(digitsOnly);
                              setOtpError("");
                            }}
                            type="tel"
                            placeholder={t("signupPage.phonePlaceholder")}
                            className={`w-full h-12 rounded-lg border border-gray-200 bg-white px-12 text-sm outline-none focus:border-button-green focus:ring-2 focus:ring-button-green/20 placeholder:text-gray-400 ${isRTL ? "text-right" : "text-left"
                              }`}
                          />

                          <User
                            className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? "right-4" : "left-4"
                              }`}
                          />
                        </div>

                        {otpError && (
                          <p className="text-red-500 text-sm mt-1">
                            {otpError}
                          </p>
                        )}

                        <Button
                          type="submit"
                          disabled={loading || phone.length !== 10}
                          className="mt-6 w-36 h-11 rounded-lg bg-button-green hover:bg-button-green/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span dir="auto">
                            {loading ? `${t("loading")}...` : t("header.login")}
                          </span>
                        </Button>
                      </form>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
