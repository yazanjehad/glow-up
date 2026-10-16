"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { supportService } from "../../../integration/services/accounts/accounts.service";
import { TOKEN_KEY } from "@/app/models/constants";
import {
  SupportUi,
  SupportCategoryApi,
  SUPPORT_CATEGORIES,
} from "@/app/models/support-type";

export default function SupportPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "report">("home");
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [, setMySupport] = useState<SupportUi[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [form, setForm] = useState({
    issueType: "" as SupportCategoryApi | "",
    description: "",
  });

  const isFormValid = form.issueType && form.description;
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }
    const fetchSupport = async () => {
      try {
        const support = await supportService.getMySupports();
        setMySupport(support);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSupport();
  }, [router]);

  const handleChange =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (showSuccess) setShowSuccess(false);
      if (showError) setShowError(false);
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsUpdating(true);
      const dataToSend = {
        category: form.issueType as SupportCategoryApi,
        subject: form.issueType,
        message: form.description,
      };

      await supportService.createSupport(dataToSend);

      setShowSuccess(true);
      setForm({ issueType: "", description: "" });

      const updatedSupports = await supportService.getMySupports();
      setMySupport(updatedSupports);

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Submit Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full px-3 py-6 ${isRTL ? "text-right" : "text-left"}`}
    >
      <div className="mb-6 flex items-center gap-2 text-sm font-medium">
        <button
          onClick={() => {
            setTab("home");
            setShowSuccess(false);
            setShowError(false);
          }}
          className={tab === "home" ? "cursor-default" : "hover:underline"}
        >
          {t("supportPage.support")}
        </button>
        {tab === "report" && (
          <>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900">
              {t("supportPage.reportProblem")}
            </span>
          </>
        )}
      </div>

      {tab === "home" ? (
        <div className="space-y-3">
          <button
            onClick={() => setTab("report")}
            className="w-full flex items-center justify-between rounded-[12px] border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-medium text-gray-900">
              {t("supportPage.reportProblem")}
            </span>
            <ArrowIcon size={18} className="text-gray-400" />
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400 font-medium">
              {t("supportPage.issueType.label")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.issueType}
                onChange={handleChange("issueType")}
                className={`h-[44px] w-full appearance-none rounded-[10px] border ${
                  showError ? "border-red-500" : "border-gray-200"
                } bg-white px-5 text-sm outline-none shadow-sm transition-colors`}
              >
                <option value="">
                  {t("supportPage.issueType.placeholder")}
                </option>
                {SUPPORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`supportCenter.categories.${cat}`, cat)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${
                  isRTL ? "left-4" : "right-4"
                }`}
              />
            </div>
            {showError && (
               <p className="mt-1 flex items-center gap-1 text-[10px] text-red-500">
                 <AlertCircle size={12} />
                 {t("supportPage.issueType.error")}
               </p>
             )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-400 font-medium">
              {t("supportPage.description.label")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={handleChange("description")}
              className="min-h-[100px] w-full rounded-[10px] border border-gray-200 bg-white px-5 py-3 text-sm outline-none shadow-sm resize-none"
              placeholder={t("supportPage.description.placeholder")}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div
              className={`flex w-full ${isRTL ? "justify-end" : "justify-start"}`}
            >
              <button
                type="submit"
                disabled={isUpdating || !isFormValid}
                className={`w-[100px] h-[44px] rounded-[10px] text-sm font-medium text-white transition-all duration-300 shadow-md active:scale-95
      ${
        isFormValid
          ? "bg-[#79A66B] hover:bg-[#6b945e] shadow-[#79A66B]/20"
          : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
      }`}
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </span>
                ) : (
                  t("supportPage.send")
                )}
              </button>
            </div>

            <div
              className={`flex items-center gap-2 py-1 transition-all duration-700 ease-in-out w-full ${
                isRTL ? "justify-end" : "justify-start"
              } ${
                showSuccess
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
              }`}
            >
              {isRTL ? (
                <>
                  <span className="text-xs font-medium text-[#79A66B]">
                    {t("successMessage")}
                  </span>
                  <CheckCircle2 size={14} className="text-[#79A66B]" />
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-[#79A66B]" />
                  <span className="text-xs font-medium text-[#79A66B]">
                    {t("successMessage")}
                  </span>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
