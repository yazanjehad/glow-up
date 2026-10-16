"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface NameRegistrationProps {
  phone: string;
  isImg?: boolean;
  error?: string;
  onComplete: (data: {
    firstname: string;
    lastname: string;
    email?: string;
    gender: "MALE" | "FEMALE";
    birthDate: string;
  }) => void;
}

export function NameRegistration({
  phone,
  isImg = true,
  onComplete,
  error: externalError,
}: NameRegistrationProps) {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDateObj = new Date(dateString);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const isValidDate = (dateString: string) => {
     if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const [year, month, day] = dateString.split("-").map(Number);
    if (year < 1900 || year > new Date().getFullYear()) return false; 
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const dateObj = new Date(dateString);
    return dateObj.toISOString().slice(0, 10) === dateString;
  };

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      isValidDate(birthDate) &&
      gender.trim().length > 0 &&
      acceptedTerms
    );
  }, [firstName, lastName, birthDate, gender, acceptedTerms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const age = calculateAge(birthDate);
    if (isNaN(age) || age < 13) {
      setInternalError(isRTL ? "يجب أن يكون العمر 13 سنة أو أكثر" : "Age must be 13 or older");
      return;
    }

    onComplete({
      firstname: firstName,
      lastname: lastName,
      email: email || undefined,
      gender: gender as "MALE" | "FEMALE",
      birthDate,
    });
  };

  return (
    <div className="pt-6 pb-5 flex flex-col items-center text-center">
      {isImg && (
        <div className="w-[280px] max-w-full">
          <Image
            src="/register.png"
            alt={t("nameRegistration.title")}
            width={720}
            height={520}
            className="w-full h-auto"
            priority
          />
        </div>
      )}

      <div className="mt-5">
        <div className="text-lg font-semibold text-gray-900">{t("nameRegistration.title")}</div>
        <div className="text-sm text-gray-500 mt-1">{t("nameRegistration.subtitle")}</div>
      </div>

      <form className="w-full mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}>
              {t("profilePage.firstName.label")} <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              type="text"
              className={`w-full h-12 rounded-lg border border-gray-200 bg-white px-5 text-sm outline-none focus:border-button-green focus:ring-2 focus:ring-button-green/20 ${isRTL ? "text-right" : "text-left"}`}
            />
          </div>
          <div>
            <label className={`block text-sm text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}>
              {t("profilePage.lastName.label")} <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              type="text"
              className={`w-full h-12 rounded-lg border border-gray-200 bg-white px-5 text-sm outline-none focus:border-button-green focus:ring-2 focus:ring-button-green/20 ${isRTL ? "text-right" : "text-left"}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm text-gray-700 mb-2 ${isRTL ? "text-right" : "text-left"}`}>
            {t("registerPage.email.label")}
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className={`w-full h-12 rounded-lg border border-gray-200 bg-white px-5 text-sm outline-none focus:border-button-green focus:ring-2 focus:ring-button-green/20 ${isRTL ? "text-right" : "text-left"}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir={isRTL ? "rtl" : "ltr"}>

          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 transition-colors group-focus-within:text-button-green">
              {t("profilePage.birthDate.label")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full h-12 rounded-xl border-2 border-gray-100 bg-gray-50 px-4 text-sm font-medium outline-none 
                   transition-all duration-200 focus:border-button-green focus:bg-white focus:ring-4 focus:ring-button-green/10
                   appearance-none"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 transition-colors group-focus-within:text-button-green">
              {t("profilePage.gender.label")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-12 appearance-none rounded-xl border-2 border-gray-100 bg-gray-50 px-4 text-sm font-medium outline-none 
                   transition-all duration-200 focus:border-button-green focus:bg-white focus:ring-4 focus:ring-button-green/10"
              >
                <option value="" disabled>{t("profilePage.gender.placeholder")}</option>
                <option value="MALE">{t("profilePage.gender.male")}</option>
                <option value="FEMALE">{t("profilePage.gender.female")}</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 inset-inline-end-4 flex items-center text-gray-400 group-focus-within:text-button-green">
                <ChevronDown size={18} strokeWidth={2.5} />
              </div>
            </div>
          </div>

        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAcceptedTerms((v) => !v)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${acceptedTerms ? "bg-[#79A66B] border-[#79A66B]" : "border-gray-300 bg-white"}`}
          >
            {acceptedTerms && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
          <div className={`text-sm ${isRTL ? "text-right" : "text-left"}`}>
            <span className="text-gray-900">{t("registerPage.termsPrefix")} </span>
            <a href="/terms" className="text-[#79A66B] font-medium hover:underline">{t("registerPage.termsLink")}</a>
            <span className="text-red-500"> *</span>
          </div>
        </div>

        {(internalError || externalError) && (
          <p className="text-red-500 text-sm mb-2 text-center">
            {internalError || externalError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`mt-3 w-[180px] h-11 rounded-lg text-sm font-medium text-white transition ${canSubmit ? "bg-[#79A66B] hover:bg-[#79A66B]/90" : "bg-gray-300 cursor-not-allowed"}`}
        >
          {t("registerPage.createAccountButton")}
        </button>
      </form>
    </div>
  );
}