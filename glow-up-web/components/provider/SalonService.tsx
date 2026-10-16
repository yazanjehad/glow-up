"use client";

import React, { useState, useEffect } from "react";
import { IoMdHome } from "react-icons/io";
import { IoStorefrontOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useProviderStore } from "@/store/providerStore";
import { ServiceProvider } from "@/integration/services/provider/providerService";

const SalonService = () => {
  const { t, i18n } = useTranslation();
  const { serviceLocation, setServiceLocation } = useProviderStore();
  const nav = useNavigationFlow();
  const [isLoading, setIsLoading] = useState(false);

  const dir = i18n.language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (!serviceLocation) {
      setServiceLocation("salon");
    }
  }, [serviceLocation, setServiceLocation]);

  const isSalonSelected = serviceLocation === "salon" || serviceLocation === "both";
  const isHomeSelected = serviceLocation === "home" || serviceLocation === "both";

  const handleToggle = (type: "salon" | "home") => {
    let newValue: "home" | "salon" | "both" | null = null;

    if (type === "salon") {
      if (isSalonSelected && isHomeSelected) newValue = "home";
      else if (isSalonSelected && !isHomeSelected) newValue = null; 
      else if (!isSalonSelected && isHomeSelected) newValue = "both";
      else newValue = "salon";
    } else {
      if (isHomeSelected && isSalonSelected) newValue = "salon";
      else if (isHomeSelected && !isSalonSelected) newValue = null;
      else if (!isHomeSelected && isSalonSelected) newValue = "both";
      else newValue = "home";
    }

    setServiceLocation(newValue as any);
  };

  const goNext = async () => {
    if (!serviceLocation || isLoading) return;
    setIsLoading(true);
    try {
      await ServiceProvider.updateProfile({ serviceLocation });
      nav.goToProviderLocation();
    } catch (error) {
      console.error("❌ Error:", error);
      nav.goToProviderLocation();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4" dir={dir}>
      <div className="flex justify-center gap-6 w-full max-w-md">
        
        <div
          onClick={() => handleToggle("salon")}
          className={`
            flex-1 h-40 flex flex-col items-center justify-center 
            rounded-2xl cursor-pointer transition-all duration-300 border-2
            ${isSalonSelected ? "bg-[#F5F5F5] border-[#79A66B] shadow-sm" : "bg-white border-[#E0E0E0] opacity-70"}
          `}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${isSalonSelected ? "bg-[#79A66B]/10" : "bg-gray-100"}`}>
            <IoStorefrontOutline className={`w-8 h-8 ${isSalonSelected ? "text-[#79A66B]" : "text-gray-400"}`} />
          </div>
          <span className={`text-base font-bold ${isSalonSelected ? "text-black" : "text-gray-400"}`}>
            {t("serviceLocationProvider.options.salon")}
          </span>
        </div>

        <div
          onClick={() => handleToggle("home")}
          className={`
            flex-1 h-40 flex flex-col items-center justify-center 
            rounded-2xl cursor-pointer transition-all duration-300 border-2
            ${isHomeSelected ? "bg-[#F5F5F5] border-[#79A66B] shadow-sm" : "bg-white border-[#E0E0E0] opacity-70"}
          `}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${isHomeSelected ? "bg-[#79A66B]/10" : "bg-gray-100"}`}>
            <IoMdHome className={`w-8 h-8 ${isHomeSelected ? "text-[#79A66B]" : "text-gray-400"}`} />
          </div>
          <span className={`text-base font-bold ${isHomeSelected ? "text-black" : "text-gray-400"}`}>
            {t("serviceLocationProvider.options.home")}
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3 mt-8">
        <button
          type="button"
          disabled={!serviceLocation || isLoading}
          onClick={goNext}
          className={`w-full py-4 rounded-xl font-bold transition flex justify-center items-center ${serviceLocation ? "bg-[#79A66B] text-white" : "bg-gray-200 text-gray-400"}`}
        >
          {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t("next")}
        </button>
      </div>
    </div>
  );
};

export default SalonService;