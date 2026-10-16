"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { Button } from "@/components/ui/button";

export default function BookingGiftPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setError(t("bookingGift.phoneRequired"));
      return;
    }

    if (trimmedPhone.length !== 10) {
      setError(t("bookingGift.phoneInvalid"));
      return;
    }

    if (!trimmedPhone.startsWith("05")) {
      setError(t("bookingGift.phoneStartInvalid"));
      return;
    }

    if (!/^\d+$/.test(trimmedPhone)) {
      setError(t("bookingGift.phoneDigitsOnly"));
      return;
    }

    sessionStorage.setItem("giftReceiverPhone", trimmedPhone);
    
    router.push("/payment-details?mode=gift");
  };

  const isPhoneValid = phone.length === 10 && phone.startsWith("05");

  return (
    <Layout>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="min-h-[calc(100vh-72px)] bg-gray-50"
      >
        <TopBar
          titleKey="bookingGift.title"
          iconAriaLabelKey="bookingGift.back"
          icon={<ChevronArrow />}
          iconHref="/booking-for"
        />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-7">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7BAE6A]/10 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-[#7BAE6A]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("bookingGift.heading")}
                </h1>
                <p className="text-gray-600">
                  {t("bookingGift.description")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {t("bookingGift.phoneLabel")}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      value={phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        if (digitsOnly.length <= 10) {
                          setPhone(digitsOnly);
                          setError("");
                        }
                      }}
                      type="tel"
                      placeholder={t("bookingGift.phonePlaceholder")}
                      className={`w-full h-12 rounded-lg border ${
                        error ? "border-red-500" : "border-gray-200"
                      } bg-white px-12 text-sm outline-none focus:border-[#7BAE6A] focus:ring-2 focus:ring-[#7BAE6A]/20 placeholder:text-gray-400 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    />

                    <Phone
                      className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${
                        isRTL ? "right-4" : "left-4"
                      }`}
                    />
                  </div>

                  {error && (
                    <p className={`text-red-500 text-sm mt-1 ${isRTL ? "text-right" : "text-left"}`}>
                      {error}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={!isPhoneValid}
                    className="w-full sm:w-auto px-8 h-11 rounded-lg bg-[#7BAE6A] hover:bg-[#7BAE6A]/90 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("bookingGift.continue")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>

  );
}
