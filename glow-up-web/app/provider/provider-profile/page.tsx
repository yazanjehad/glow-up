"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import ProfileFields from "../../../components/provider/salon-profile";
import StepHeader from "@/components/shared/StepHeader";

import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useProviderStore } from "@/store/providerStore";
import { authServices } from "@/integration/services/auth/authServices";
import type { ProviderProfileDto } from "@/integration/services/auth/auth.types";

export default function ProviderProfilePage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [errorKey, setErrorKey] = useState<string | null>(null);
  const { salonName, salonEmail, setSalonName, setSalonEmail } = useProviderStore();

  const [fullName, setFullName] = useState(salonName || "");
  const [email, setEmail] = useState(salonEmail || "");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigationFlow();

  const providerId = typeof window !== "undefined" ? localStorage.getItem("providerId") : null;

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const canSubmit = useMemo(() => {
    return fullName.trim().length >= 2 && email.trim() && isValidEmail(email) && agree && !loading;
  }, [fullName, email, agree, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

    if (fullName.trim().length < 2) {
      setErrorKey("errorsAuth.nameTooShort");
      return;
    }

    setLoading(true);

    const profileData: Partial<ProviderProfileDto> = {
      name: fullName.trim(),
      email: email.trim(),
    };

    try {
      if (providerId) {
        await authServices.updateProviderProfile(profileData);
      } else {
        (profileData as ProviderProfileDto).password = "testpassword";
        await authServices.createProviderProfile(profileData as ProviderProfileDto);
      }

      setSalonName(fullName.trim());
      setSalonEmail(email.trim());

      const storedProvider = localStorage.getItem("provider");
      const updatedProvider = storedProvider
        ? { ...JSON.parse(storedProvider), ...profileData }
        : profileData;
      localStorage.setItem("provider", JSON.stringify(updatedProvider));

      nav.goToProviderActivityType();
    } catch (err: any) {
      const rawMessage =
        err?.response?.data?.message ??
        err?.response?.data ??
        err?.message ??
        "";

      const status = err?.response?.status;

      const isDuplicateEmail =
        err?.response?.data?.code === 11000 ||
        err?.code === 11000 ||
        /E11000|duplicate key|Email already exists|email must be unique/i.test(rawMessage);

      if (isDuplicateEmail || status === 409) {
        const msg = i18n.language.startsWith("ar") ? "هذا البريد الإلكتروني مستخدم مسبقًا" : "Email already exists";
        setErrorKey(msg);
      } else if (status === 401 || /jwt expired/i.test(rawMessage)) {
        setErrorKey(t("loginPage.sessionExpired"));
        router.push("/login");
      } else if (Array.isArray(rawMessage)) {
        setErrorKey(rawMessage[0]);
      } else {
        setErrorKey(rawMessage || t("loginPage.errorCreateProfile"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (providerId && (!fullName || !email)) {
      const storedProvider = localStorage.getItem("provider");
      if (storedProvider) {
        const provider = JSON.parse(storedProvider);
        setFullName(provider.name || "");
        setEmail(provider.email || "");
      }
    }
  }, [providerId, fullName, email]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      <div className="mx-auto w-full max-w-[420px]">
        <div dir="ltr">
          <StepHeader step={1} totalSteps={7} onBack={() => router.back()} />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-[18px] font-semibold text-gray-900">
            {t("provider.providerProfile.title")}
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            {t("provider.providerProfile.subtitle")}
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <ProfileFields
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            error={errorKey ? t(errorKey) : ""}
            isReadOnly={loading}
            readOnlyEmail={!!providerId}
          />

          <div className="flex items-start gap-2 text-[13px] text-gray-600">
            <input
              type="checkbox"
              id="agree-terms"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#79A66B]"
            />
            <label htmlFor="agree-terms" className="leading-5 cursor-pointer">
              <span>{t("provider.providerProfile.termsText") || "I agree to the"}{" "}</span>
              <a
                href="/provider/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#79A66B] underline underline-offset-2 hover:text-[#6b945d]"
              >
                {t("nameRegistration.termsLink")}
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "h-12 w-full rounded-xl text-[14px] font-semibold transition",
              canSubmit
                ? "bg-[#79A66B] text-white hover:bg-[#6b945d]"
                : "cursor-not-allowed bg-gray-200 text-gray-400",
            ].join(" ")}
          >
            {loading ? t("loading") : t("admin-dashboard.serviceNext")}
          </button>
        </form>
      </div>
    </div>
  );
}