"use client";

import { useTranslation } from "react-i18next";
import HeaderProvider from "../../../components/shared/provider/HeaderProvider";
import LocationManager from "../../../components/provider/location";

export default function LocationClient() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full max-w-[420px] mx-auto">
      <HeaderProvider
        titleKey="provider.providerLocation.title"
        subtitleKey="provider.providerLocation.subtitle"
      />

      <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
        <LocationManager />
      </div>
    </div>
  );
}