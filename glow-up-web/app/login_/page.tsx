"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import Image from "next/image";

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopBar } from "@/components/shared/TopBar";
import { OtpInput } from "@/components/shared/OtpInput";
import { authServices } from "@/integration/services/auth/authServices";


export default function LoginPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "salon">("user");
  const [showOtp, setShowOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) return;

    try {
      await authServices.requestOTP({ phone });
      setShowOtp(true);
    } catch (error) {
      console.error(error);
      setOtpError("Invalid phone number");
    }
  };

  const handleBackToPhone = () => {
    setShowOtp(false);
    setPhone("");
  };

  const handleOtpComplete = async (code: string) => {
    try {
      const res: any = await authServices.verifyOTP({ phone, code });

      localStorage.setItem("otpToken", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/home");
    } catch (error) {
      setOtpError(t("otpPage.errorInvalid"));
      setTimeout(() => setOtpError(""), 3000);
    }
  };

  return (
    <Layout>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-[calc(100vh-72px)] bg-gray-50"
      >
        <TopBar
          titleKey={showOtp ? "otpPage.topBarTitle" : "loginPage.topBarTitle"}
          iconHref={showOtp ? undefined : "/home"}
          onIconClick={showOtp ? handleBackToPhone : undefined}
          iconAriaLabelKey={showOtp ? "otpPage.backAria" : "loginPage.homeAria"}
          icon={
            showOtp ? (
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
              {showOtp ? (
                <OtpInput
                  phone={phone}
                  onComplete={handleOtpComplete}
                  error={otpError}
                />
              ) : (
                <Tabs
                  defaultValue="user"
                  onValueChange={(v) =>
                    setRole(v === "salon" ? "salon" : "user")
                  }
                >
                  <TabsList className="grid grid-cols-2 w-full bg-gray-100 rounded-full p-1 h-11">
                    {isRTL ? (
                      <>
                        <TabsTrigger
                          value="salon"
                          className="rounded-lg text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("loginPage.tabSalon")}
                        </TabsTrigger>
                        <TabsTrigger
                          value="user"
                          className="rounded-lg text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("loginPage.tabUser")}
                        </TabsTrigger>
                      </>
                    ) : (
                      <>
                        <TabsTrigger
                          value="user"
                          className="rounded-lg text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("loginPage.tabUser")}
                        </TabsTrigger>
                        <TabsTrigger
                          value="salon"
                          className="rounded-lg text-sm data-[state=active]:bg-button-green data-[state=active]:text-white"
                        >
                          {t("loginPage.tabSalon")}
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>

                  <TabsContent value={role} className="mt-0">
                    <div className="pt-6 pb-5 flex flex-col items-center text-center">
                      <div className="w-[280px] max-w-full">
                        <Image
                          src="/login-background.png"
                          alt={t("loginPage.topBarTitle")}
                          width={720}
                          height={520}
                          className="w-full h-auto"
                          priority
                        />
                      </div>

                      <div className="mt-5">
                        <div className="text-lg font-semibold text-gray-900">
                          {t("loginPage.welcomeTitle")}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {t("loginPage.welcomeSubtitle")}
                        </div>
                      </div>

                      <form className="w-full mt-6" onSubmit={onSubmit}>
                        <label
                          className={`block text-sm text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {t("loginPage.phoneLabel")}{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            type="tel"
                            placeholder={t("loginPage.phonePlaceholder")}
                            className={`w-full h-12 rounded-lg border border-gray-200 bg-white px-12 text-sm outline-none focus:border-button-green focus:ring-2 focus:ring-button-green/20 placeholder:text-gray-400 ${isRTL ? "text-right" : "text-left"
                              }`}
                          />
                          <User
                            className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? "right-4" : "left-4"
                              }`}
                          />
                        </div>

                        <Button
                          type="submit"
                          className="mt-6 w-36 h-11 rounded-lg bg-button-green hover:bg-button-green/90 text-white"
                        >
                          {t("loginPage.submit")}
                        </Button>

                        <div className="mt-4 text-sm text-gray-600">
                          {t("loginPage.noAccount")}{" "}
                          <Link
                            href="/signup"
                            className="text-green-700 hover:underline"
                          >
                            {t("loginPage.createAccount")}
                          </Link>
                        </div>
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
