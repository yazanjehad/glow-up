"use client";

import React from "react";
import { User, Mail, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileFieldsProps {
  fullName: string;
  setFullName: (v: string) => void;
  email?: string;
  setEmail?: (v: string) => void;
  isReadOnly?: boolean;
  readOnlyEmail?: boolean;
  error?: string;

  showDescription?: boolean;
  description?: string;
  setDescription?: (v: string) => void;

  fullNameEn?: string;
  setFullNameEn?: (v: string) => void;
  descriptionEn?: string;
  setDescriptionEn?: (v: string) => void;

  policy?: string;
  setPolicy?: (v: string) => void;
  policyEn?: string;
  setPolicyEn?: (v: string) => void;
}

export default function ProfileFields({
  fullName,
  setFullName,
  email = "",
  setEmail,
  isReadOnly = false,
  readOnlyEmail = false,
  error,

  showDescription = false,
  description = "",
  setDescription,

  fullNameEn,
  setFullNameEn,
  descriptionEn = "",
  setDescriptionEn,

  policy = "",
  setPolicy,
  policyEn = "",
  setPolicyEn,
}: ProfileFieldsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [nameEnError, setNameEnError] = React.useState("");
  const [descEnError, setDescEnError] = React.useState("");
  const [policyEnError, setPolicyEnError] = React.useState("");

  const filterEnglishOnly = (val: string): string => val.replace(/[^\x00-\x7F]/g, "");
  const hasNonAscii = (val: string): boolean => /[^\x00-\x7F]/.test(val);
  const englishOnlyMsg = t("englishOnly");

  const iconSideClass = isRTL ? "right-4" : "left-4";
  const inputPadding = isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left";

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-[13px] text-gray-500">
          {t("provider.providerProfile.nameLabel")}{" "}
          <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            disabled={isReadOnly}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            className={[
              "h-12 w-full rounded-xl border border-gray-200 bg-white text-[14px] outline-none transition",
              isReadOnly
                ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
              inputPadding,
            ].join(" ")}
          />
          <User
            className={[
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
              iconSideClass,
            ].join(" ")}
          />
        </div>
      </div>

      {setFullNameEn && (
        <div>
          <label className="mb-2 block text-[13px] text-gray-500">
            {t("provider.providerProfile.nameLabel")} (English)
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              disabled={isReadOnly}
              value={fullNameEn}
              onChange={(e) => {
                const val = e.target.value;
                if (hasNonAscii(val)) {
                  setNameEnError(englishOnlyMsg);
                } else {
                  setNameEnError("");
                }
                setFullNameEn(filterEnglishOnly(val));
              }}
              type="text"
              className={[
                "h-12 w-full rounded-xl border border-gray-200 bg-white text-[14px] outline-none transition",
                isReadOnly
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                  : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
                inputPadding,
              ].join(" ")}
            />
            <User
              className={[
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
                iconSideClass,
              ].join(" ")}
            />
          </div>
          {nameEnError && (
            <p className="mt-1 text-[11px] text-red-500">{nameEnError}</p>
          )}
        </div>
      )}

      {setEmail && (
        <div>
          <label className="mb-2 block text-[13px] text-gray-500">
            {t("provider.providerProfile.emailLabel")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              disabled={isReadOnly || readOnlyEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={[
                "h-12 w-full rounded-xl border border-gray-200 bg-white text-[14px] outline-none transition",
                isReadOnly || readOnlyEmail
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                  : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
                inputPadding,
              ].join(" ")}
            />
            <Mail
              className={[
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400",
                iconSideClass,
              ].join(" ")}
            />
          </div>
        </div>
      )}

      {showDescription && (
        <div>
          <label className="mb-2 block text-[13px] text-gray-500">
            {t("provider.providerProfile.descriptionLabel")}
          </label>
          <div className="relative">
            <textarea
              disabled={isReadOnly}
              value={description}
              onChange={(e) => setDescription?.(e.target.value)}
              rows={4}
              className={[
                "w-full rounded-xl border border-gray-200 bg-white py-3 text-[14px] outline-none transition resize-none",
                isReadOnly
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                  : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
                inputPadding,
              ].join(" ")}
            />
            <FileText
              className={[
                "absolute top-4 h-4 w-4 text-gray-400",
                iconSideClass,
              ].join(" ")}
            />
          </div>
        </div>
      )}

      {showDescription && setDescriptionEn && (
        <div>
          <label className="mb-2 block text-[13px] text-gray-500">
            {t("provider.providerProfile.descriptionLabel")} (English)
          </label>
          <div className="relative">
            <textarea
              disabled={isReadOnly}
              value={descriptionEn}
              onChange={(e) => {
                const val = e.target.value;
                if (hasNonAscii(val)) {
                  setDescEnError(englishOnlyMsg);
                } else {
                  setDescEnError("");
                }
                setDescriptionEn?.(filterEnglishOnly(val));
              }}
              rows={4}
              className={[
                "w-full rounded-xl border border-gray-200 bg-white py-3 text-[14px] outline-none transition resize-none",
                isReadOnly
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                  : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
                inputPadding,
              ].join(" ")}
            />
            <FileText
              className={[
                "absolute top-4 h-4 w-4 text-gray-400",
                iconSideClass,
              ].join(" ")}
            />
          </div>
          {descEnError && (
            <p className="mt-1 text-[11px] text-red-500">{descEnError}</p>
          )}
        </div>
      )}

      {showDescription && setPolicy && (
        <div>
          <label className="mb-2 block text-[13px] text-gray-500">
            {t("provider.providerProfile.policyLabel")}
          </label>
          <div className="relative">
            <textarea
              disabled={isReadOnly}
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
              rows={4}
              className={[
                "w-full rounded-xl border border-gray-200 bg-white py-3 text-[14px] outline-none transition resize-none",
                isReadOnly
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                  : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
                inputPadding,
              ].join(" ")}
            />
            <FileText
              className={[
                "absolute top-4 h-4 w-4 text-gray-400",
                iconSideClass,
              ].join(" ")}
            />
          </div>
        </div>
      )}

      {showDescription && setPolicyEn && (
        <div>
          <label className="mb-2 block text-[13px] text-gray-500">
            {t("provider.providerProfile.policyLabel")} (English)
          </label>
          <div className="relative">
            <textarea
              disabled={isReadOnly}
              value={policyEn}
              onChange={(e) => {
                const val = e.target.value;
                if (hasNonAscii(val)) {
                  setPolicyEnError(englishOnlyMsg);
                } else {
                  setPolicyEnError("");
                }
                setPolicyEn(filterEnglishOnly(val));
              }}
              rows={4}
              className={[
                "w-full rounded-xl border border-gray-200 bg-white py-3 text-[14px] outline-none transition resize-none",
                isReadOnly
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-transparent"
                  : "focus:border-button-green focus:ring-2 focus:ring-button-green/15",
                inputPadding,
              ].join(" ")}
            />
            <FileText
              className={[
                "absolute top-4 h-4 w-4 text-gray-400",
                iconSideClass,
              ].join(" ")}
            />
          </div>
          {policyEnError && (
            <p className="mt-1 text-[11px] text-red-500">{policyEnError}</p>
          )}
        </div>
      )}

      {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
