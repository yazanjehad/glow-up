"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import CenterGreenLoader from "../../../components/ui/CenterGreenLoader";
import { TOKEN_KEY } from "@/app/models/constants";
import { profileService } from "../../../integration/services/accounts/accounts.service";
import { getUserFriendlyErrorMessage } from "@/lib/errorMessages";

const MAX_NAME_LENGTH = 50;

export default function ProfilePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
  });

  const [initialData, setInitialData] = useState<typeof form | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const maxDateStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;

      if ((key === "firstName" || key === "lastName") && value) {
        if (value.length > MAX_NAME_LENGTH) {
          value = value.slice(0, MAX_NAME_LENGTH);
        }
      }

      if (key === "birthDate" && value) {
        if (value > maxDateStr) return;
      }

      if (key === "phone") {
        value = value.replace(/\D/g, "").slice(0, 10);
      }

      setForm({ ...form, [key]: value });
    };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const customer = await profileService.getCustomer();
        const data = {
          firstName: customer.firstName ?? "",
          lastName: customer.lastName ?? "",
          birthDate: customer.birthDate ? customer.birthDate.slice(0, 10) : "",
          gender: customer.gender?.toLowerCase() || "",
          email: customer.email ?? "",
          phone: customer.phone ?? "",
        };
        setForm(data);
        setInitialData(data);
      } catch (e: any) {
        const errorMessage = getUserFriendlyErrorMessage(e, { isRTL });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [router, isRTL]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.birthDate && form.birthDate > maxDateStr) {
      setError(t("profilePage.birthDate.futureNotAllowed") || "Date of birth cannot be in the future.");
      return;
    }

    if (!form.phone) {
      setError(t("signupPage.errorPhoneRequired") || "Phone number is required");
      return;
    }

    if (form.phone) {
      if (form.phone.length !== 10) {
        setError(t("signupPage.errorPhoneLength") || "Phone number must be exactly 10 digits");
        return;
      }
      if (!form.phone.startsWith("05")) {
        setError(t("signupPage.errorPhoneStart") || "Phone number must start with 05");
        return;
      }
    }

    try {
      setIsUpdating(true);
      setError("");
      await profileService.updateCustomer({
        ...form,
        gender: form.gender.toUpperCase() as any,
      });
      setInitialData(form);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: any) {
      const errorMessage = getUserFriendlyErrorMessage(e, { isRTL });
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <CenterGreenLoader label={t("loading")} />;

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialData);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full px-3 py-6 ${isRTL ? "text-right" : "text-left"}`}
    >
      <h1 className="mb-6 text-base font-medium">{t("profilePage.title")}</h1>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            {t("profilePage.firstName.label")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={handleChange("firstName")}
            maxLength={MAX_NAME_LENGTH}
            className="h-[44px] w-full rounded-[10px] border border-gray-200 bg-white px-5 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            {t("profilePage.lastName.label")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={handleChange("lastName")}
            maxLength={MAX_NAME_LENGTH}
            className="h-[44px] w-full rounded-[10px] border border-gray-200 bg-white px-5 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            {t("phone")} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            className="h-[44px] w-full rounded-[10px] border border-gray-200 bg-white px-5 text-sm outline-none"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            {t("email")}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="h-[44px] w-full rounded-[10px] border border-gray-200 bg-white px-5 text-sm outline-none"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            {t("profilePage.birthDate.label")}
          </label>
          <input
            type="date"
            value={form.birthDate}
            onChange={handleChange("birthDate")}
            max={maxDateStr}
            className="h-[44px] w-full rounded-[10px] border border-gray-200 bg-white px-5 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">
            {t("profilePage.gender.label")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={form.gender}
              onChange={handleChange("gender")}
              className="h-[44px] w-full appearance-none rounded-[10px] border border-gray-200 bg-white px-5 text-sm outline-none"
            >
              <option value="">{t("profilePage.gender.placeholder")}</option>
              <option value="male">{t("profilePage.gender.male")}</option>
              <option value="female">{t("profilePage.gender.female")}</option>
            </select>
            <ChevronDown
              size={16}
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? "left-4" : "right-4"}`}
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 pt-4">
          <button
            type="submit"
            disabled={isUpdating || !hasChanges}
            className={`w-[100px] h-[44px] rounded-[10px] text-sm font-medium text-white transition-all duration-300 shadow-md active:scale-95
      ${
        hasChanges
          ? "bg-[#79A66B] hover:bg-[#6b945e] shadow-[#79A66B]/20"
          : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
      }`}
          >
            {isUpdating ? (
              <span className="flex items-center justify-center">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </span>
            ) : (
              t("profilePage.save")
            )}
          </button>

          <div
            className={`transition-all duration-500 transform ${
              showSuccess
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-2 py-1 px-3 ">
              <CheckCircle2 size={14} className="text-[#79A66B]" />
              <span className="text-xs font-medium text-[#79A66B]">
                {t("successMessage")}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}