"use client";

import React from "react";
import { IoMdHome } from "react-icons/io";
import { IoStorefrontOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { useProviderStore } from "@/store/providerStore";
import { useNavigationFlow } from "@/lib/useNavigationFlow";

interface Props {
  isReadOnly?: boolean;
  isCreateMode?: boolean;
}

const ServiceModeManager = ({
  isReadOnly = false,
  isCreateMode = false,
}: Props) => {
  const { t, i18n } = useTranslation();
  const { serviceMode, setServiceMode } = useProviderStore();
  const nav = useNavigationFlow();

  const handleNext = () => {
    if (serviceMode) nav.goToProviderLocation();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <div
          onClick={() => !isReadOnly && setServiceMode("STORE")}
          className={`flex-1 h-36 flex flex-col items-center justify-center rounded-2xl transition border ${
            isReadOnly ? "cursor-default" : "cursor-pointer"
          } ${serviceMode === "STORE" ? "bg-[#F5F5F5] border-[#79A66B]" : "bg-white border-[#E0E0E0]"}`}
        >
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <IoStorefrontOutline
              className={
                serviceMode === "STORE"
                  ? "text-black w-7 h-7"
                  : "text-gray-400 w-7 h-7"
              }
            />
          </div>
          <span className="text-lg font-medium">{t("fromStore")}</span>
        </div>

        <div
          onClick={() => !isReadOnly && setServiceMode("HOME")}
          className={`flex-1 h-36 flex flex-col items-center justify-center rounded-2xl transition border ${
            isReadOnly ? "cursor-default" : "cursor-pointer"
          } ${serviceMode === "HOME" ? "bg-[#F5F5F5] border-[#79A66B]" : "bg-white border-[#E0E0E0]"}`}
        >
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <IoMdHome
              className={
                serviceMode === "HOME"
                  ? "text-black w-7 h-7"
                  : "text-gray-400 w-7 h-7"
              }
            />
          </div>
          <span className="text-lg font-medium">{t("fromHome")}</span>
        </div>
      </div>

      {isCreateMode && (
        <div className="flex w-full flex-col gap-3 mt-8">
          <button
            disabled={!serviceMode}
            onClick={handleNext}
            className={`w-full py-3 rounded-xl font-semibold transition ${
              serviceMode
                ? "bg-[#79A66B] text-white hover:bg-[#6b945d]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {t("serviceNext")}
          </button>
          <button
            onClick={() => nav.goToProviderLocation()}
            className="w-full py-3 rounded-xl text-black font-semibold border border-black bg-white hover:bg-gray-100 transition"
          >
            {t("skip")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceModeManager;