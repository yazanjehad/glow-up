"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/shared/PrimaryButton";
import TeamManager from "../../../components/provider/teamManager";

export default function TeamPage() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onNext = () => {
    setIsSubmitting(true);
    router.push("/admin-dashboard");
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full">
      <h1 className="text-center text-[18px] font-semibold text-gray-900">
        {t("provider.providerTeam.title")}
      </h1>

      <TeamManager />

      <PrimaryButton
        className="mt-5"
        onClick={onNext}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? isRTL
            ? "جاري التحويل..."
            : "Redirecting..."
          : t("provider.common.next")}
      </PrimaryButton>
    </div>
  );
}