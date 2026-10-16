"use client";

import React, { useMemo, useState } from "react";
import {
  IoMale,
  IoFemale,
  IoMaleFemale,
  IoStorefrontOutline,
} from "react-icons/io5";
import { useNavigationFlow } from "@/lib/useNavigationFlow";
import { useTranslation } from "react-i18next";
import { useProviderStore, GenderType } from "@/store/providerStore";

const MAX_CHARS = 500;

const types: {
  id: number;
  titleKey: string;
  icon: typeof IoMale;
  value: GenderType;
}[] = [
    { id: 1, titleKey: "types.men", icon: IoMale, value: "men" },
    { id: 2, titleKey: "types.women", icon: IoFemale, value: "women" },
    { id: 3, titleKey: "types.both", icon: IoMaleFemale, value: "both" },
  ];

const SalonProfile = () => {
  const { t, i18n } = useTranslation();
  const {
    salonName,
    setSalonName,
    salonDescription,
    setSalonDescription,
    salonNameEn,
    setSalonNameEn,
    salonDescriptionEn,
    setSalonDescriptionEn,
    salonPolicy,
    setSalonPolicy,
    salonPolicyEn,
    setSalonPolicyEn,
    genderType,
    setGenderType,
  } = useProviderStore();
  const { goToSalonServiceProvider } = useNavigationFlow();

  const [touched, setTouched] = useState(false);
  const [nameEnError, setNameEnError] = useState("");
  const [descEnError, setDescEnError] = useState("");
  const [policyEnError, setPolicyEnError] = useState("");

  React.useEffect(() => {
    setSalonName("");
    setSalonNameEn("");
    setSalonDescription("");
    setSalonDescriptionEn("");
    setSalonPolicy("");
    setSalonPolicyEn("");
    setGenderType(null);
  }, [setSalonName, setSalonNameEn, setSalonDescription, setSalonDescriptionEn, setSalonPolicy, setSalonPolicyEn, setGenderType]);

  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  const textAlignClass = dir === "rtl" ? "text-right" : "text-left";
  const iconOffset = dir === "rtl" ? "right-6" : "left-6";

  const salonNameError = useMemo(() => {
    const trimmed = salonName.trim();

    if (!trimmed) return "";

    // لازم يبدأ بحرف عربي أو إنجليزي
    const startsWithLetter = /^[A-Za-z\u0600-\u06FF]/.test(trimmed);

    if (!startsWithLetter) {
      return t("salonNameMustStartWithLetter");
    }

    return "";
  }, [salonName, t]);

  const isFormValid =
    salonName.trim().length > 0 &&
    salonNameEn.trim().length > 0 &&
    salonDescription.trim().length > 0 &&
    salonDescriptionEn.trim().length > 0 &&
    salonPolicy.trim().length > 0 &&
    salonPolicyEn.trim().length > 0 &&
    genderType !== null &&
    !salonNameError;

  return (
    <>
      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("salonName")}
          <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={salonName}
            onChange={(e) => {
              setSalonName(e.target.value);
              if (!touched) setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            className={`w-full p-4 mx-2 ${dir === "rtl" ? "pl-12 pr-12" : "pl-12 pr-12"
              } bg-white border rounded-2xl ${textAlignClass} placeholder-gray-300
            focus:outline-none focus:ring-0
            ${touched && salonNameError ? "border-red-300" : "border-[#E0E0E0]"}`}
          />

          <div
            className={`absolute ${iconOffset} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
          >
            <IoStorefrontOutline size={24} />
          </div>
        </div>

        {touched && salonNameError && (
          <p className="text-red-500 text-sm mt-1 px-2">{salonNameError}</p>
        )}
      </div>

      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("salonName")} (English)
          <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={salonNameEn}
            onChange={(e) => {
              const val = e.target.value;
              if (/[^\x00-\x7F]/.test(val)) {
                setNameEnError(t("englishOnly"));
              } else {
                setNameEnError("");
              }
              setSalonNameEn(val.replace(/[^\x00-\x7F]/g, ""));
            }}
            className={`w-full p-4 mx-2 ${dir === "rtl" ? "pl-12 pr-12" : "pl-12 pr-12"
              } bg-white border rounded-2xl ${textAlignClass} placeholder-gray-300
            focus:outline-none focus:ring-0 border-[#E0E0E0]`}
          />

          <div
            className={`absolute ${iconOffset} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
          >
            <IoStorefrontOutline size={24} />
          </div>
        </div>
        {nameEnError && (
          <p className="text-red-500 text-xs mt-1 px-2">{nameEnError}</p>
        )}
      </div>

      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("salonDescription")}
          <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          maxLength={MAX_CHARS}
          value={salonDescription}
          onChange={(e) => setSalonDescription(e.target.value)}
          placeholder={t("salonDescriptionPlaceholder")}
          className={`w-full p-4 mx-2 bg-white border border-[#E0E0E0] rounded-2xl ${textAlignClass} placeholder-gray-300
          focus:outline-none focus:ring-0 focus:border-[#E0E0E0]`}
        />

        <div
          className={`${dir === "rtl" ? "text-left" : "text-right"} text-sm text-gray-900`}
        >
          {t("charsRemaining", { count: MAX_CHARS - salonDescription.length })}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("salonDescription")} (English)
          <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          maxLength={MAX_CHARS}
          value={salonDescriptionEn}
          onChange={(e) => {
            const val = e.target.value;
            if (/[^\x00-\x7F]/.test(val)) {
              setDescEnError(t("englishOnly"));
            } else {
              setDescEnError("");
            }
            setSalonDescriptionEn(val.replace(/[^\x00-\x7F]/g, ""));
          }}
          placeholder={t("salonDescriptionPlaceholder") + " in English"}
          className={`w-full p-4 mx-2 bg-white border border-[#E0E0E0] rounded-2xl ${textAlignClass} placeholder-gray-300
          focus:outline-none focus:ring-0 focus:border-[#E0E0E0]`}
        />
        {descEnError && (
          <p className="text-red-500 text-xs mt-1 px-2">{descEnError}</p>
        )}

        <div
          className={`${dir === "rtl" ? "text-left" : "text-right"} text-sm text-gray-900`}
        >
          {t("charsRemaining", { count: MAX_CHARS - salonDescriptionEn.length })}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("salonPolicy")}
          <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          maxLength={MAX_CHARS}
          value={salonPolicy}
          onChange={(e) => setSalonPolicy(e.target.value)}
          placeholder={t("salonPolicyPlaceholder")}
          className={`w-full p-4 mx-2 bg-white border border-[#E0E0E0] rounded-2xl ${textAlignClass} placeholder-gray-300
          focus:outline-none focus:ring-0 focus:border-[#E0E0E0]`}
        />

        <div
          className={`${dir === "rtl" ? "text-left" : "text-right"} text-sm text-gray-900`}
        >
          {t("charsRemaining", { count: MAX_CHARS - salonPolicy.length })}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("salonPolicy")} (English)
          <span className="text-red-500">*</span>
        </label>

        <input
          type="text"
          maxLength={MAX_CHARS}
          value={salonPolicyEn}
          onChange={(e) => {
            const val = e.target.value;
            if (/[^\x00-\x7F]/.test(val)) {
              setPolicyEnError(t("englishOnly"));
            } else {
              setPolicyEnError("");
            }
            setSalonPolicyEn(val.replace(/[^\x00-\x7F]/g, ""));
          }}
          placeholder={t("salonPolicyPlaceholder") + " in English"}
          className={`w-full p-4 mx-2 bg-white border border-[#E0E0E0] rounded-2xl ${textAlignClass} placeholder-gray-300
          focus:outline-none focus:ring-0 focus:border-[#E0E0E0]`}
        />
        {policyEnError && (
          <p className="text-red-500 text-xs mt-1 px-2">{policyEnError}</p>
        )}

        <div
          className={`${dir === "rtl" ? "text-left" : "text-right"} text-sm text-gray-900`}
        >
          {t("charsRemaining", { count: MAX_CHARS - salonPolicyEn.length })}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 w-full max-w-xl mx-auto p-4"
        dir={dir}
      >
        <label className="text-gray-400 text-sm font-medium flex items-center gap-1">
          {t("chooseType")}
          <span className="text-red-500">*</span>
        </label>

        <div className="flex gap-4 mt-2">
          {types.map((type) => {
            const Icon = type.icon;
            const isActive = genderType === type.value;

            return (
              <div
                key={type.id}
                onClick={() => setGenderType(type.value)}
                className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition"
              >
                <div
                  className={`w-12 h-12 mb-2 flex items-center justify-center rounded-full transition
                  ${isActive ? "bg-green-100" : "bg-green-50"}`}
                >
                  <Icon
                    size={24}
                    className={
                      isActive ? "text-[#79A66B]" : "text-green-700/50"
                    }
                  />
                </div>

                <span
                  className={`text-sm font-semibold transition ${isActive ? "text-gray-900" : "text-gray-400"
                    }`}
                >
                  {t(type.titleKey)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex w-full max-w-xl mx-auto pt-6">
          <button
            disabled={!isFormValid}
            onClick={() => {
              setTouched(true);
              if (!isFormValid) return;
              goToSalonServiceProvider();
            }}
            className={`w-full py-3 rounded-xl text-white font-semibold transition
              ${isFormValid
                ? "bg-[#79A66B] hover:bg-[#5a824f]"
                : "bg-green-200 cursor-not-allowed"
              }`}
          >
            {t("next")}
          </button>
        </div>
      </div>
    </>
  );
};

export default SalonProfile;
