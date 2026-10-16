"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import HeaderProvider from "@/components/shared/provider/HeaderProvider";
import SalonService from "@/components/provider/SalonService";

const SalonServiceCreatePage = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="w-full max-w-[500px] mx-auto px-4"
    >
      <HeaderProvider
        titleKey="serviceLocation.title"
        subtitleKey="serviceLocation.subtitle"
      />

      <div className="mt-8">
        <SalonService />
      </div>
    </div>
  );
};

export default SalonServiceCreatePage;
