"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { UserPackagesService } from "@/integration/services/user/user.service";
import { TOKEN_KEY } from "@/app/models/constants";

/** Arabic/Persian digit keys → ASCII 0–9 so OTP advances correctly in RTL locales */
function normalizeOtpDigits(raw: string): string {
  let out = "";
  for (const c of raw) {
    const code = c.charCodeAt(0);
    if (code >= 0x0660 && code <= 0x0669)
      out += String.fromCharCode(code - 0x0660 + 48);
    else if (code >= 0x06f0 && code <= 0x06f9)
      out += String.fromCharCode(code - 0x06f0 + 48);
    else out += c;
  }
  return out.replace(/\D/g, "");
}

/* =========================
   Settings Row
========================= */
type SettingsRowProps = {
  title: string;
  href?: string;
  rightSlot?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  showArrow?: boolean;
};

function SettingsRow({
  title,
  href,
  rightSlot,
  danger,
  onClick,
  showArrow,
}: SettingsRowProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  const content = (
    <div className="flex items-center justify-between rounded-[12px] border border-gray-100 bg-white px-4 py-3 shadow-[0_10px_18px_-14px_rgba(0,0,0,0.35)]">
      <span
        className={`text-sm font-medium ${
          danger ? "text-red-500" : "text-gray-900"
        }`}
      >
        {title}
      </span>

      <div className="flex items-center gap-3">
        {rightSlot}
        {(href || showArrow) && (
          <ArrowIcon size={18} className="text-gray-400" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full">
      {content}
    </button>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        checked ? "bg-[#7AA874]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition transform
          ${checked ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([
    null,
    null,
    null,
    null,
  ]);

  const onDeleteAccount = async () => {
    setShowDeleteDialog(true);
  };

  const handleRequestDeleteOTP = async () => {
    if (!deleteReason.trim()) {
      setError(t("settingsPage.pleaseEnterReason"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      await UserPackagesService.RequestDeleteOTP();
      setShowDeleteDialog(false);
      setShowOTPDialog(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("settingsPage.errorRequestingOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDeleteOTP = async () => {
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 4) {
      setError(t("settingsPage.pleaseEnterOTP"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Verify with OTP and reason from state
      await UserPackagesService.VerifyDeleteOTP(otpCode, deleteReason);
      
      // Clear all user data from storage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("user");
      localStorage.removeItem("providerId");
      localStorage.removeItem("provider");
      localStorage.removeItem("provider-store");
      localStorage.removeItem("otpToken");
      
      // Show success dialog
      setShowOTPDialog(false);
      setShowSuccessDialog(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("settingsPage.errorVerifyingOTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digits = normalizeOtpDigits(value);

    if (digits.length === 0) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (digits.length > 1) {
      const nextFocus = Math.min(index + digits.length, 3);
      flushSync(() => {
        setOtpDigits((prev) => {
          const next = [...prev];
          for (let i = 0; i < digits.length && index + i < 4; i++) {
            next[index + i] = digits[i]!;
          }
          return next;
        });
      });
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    flushSync(() => {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = digits;
        return next;
      });
    });
    if (index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      // Trigger delete account on Enter
      e.preventDefault();
      handleVerifyDeleteOTP();
    }
  };

  useEffect(() => {
    if (!showOTPDialog) return;
    const id = window.setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
    return () => window.clearTimeout(id);
  }, [showOTPDialog]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="w-full px-3 py-6">
      <h1 className="mb-6 text-center text-base font-medium">
        {t("settingsPage.title")}
      </h1>

      <div className="space-y-3">
        <SettingsRow
          title={t("settingsPage.deleteAccount")}
          danger
          showArrow
          onClick={onDeleteAccount}
        />
      </div>

      {/* Delete Reason Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              {t("settingsPage.deleteAccountTitle")}
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {t("settingsPage.deleteAccountDescription")}
            </p>
            <div className="mb-4">
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t("settingsPage.reasonPlaceholder")}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                dir={isRTL ? "rtl" : "ltr"}
                style={{ minHeight: '96px' }}
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteReason("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleRequestDeleteOTP}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {loading ? t("common.loading") : t("settingsPage.continue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Verification Dialog */}
      {showOTPDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">
              {t("settingsPage.verifyOTP")}
            </h2>
            <p className="text-gray-600 mb-4">
              {t("settingsPage.otpSentDescription")}
            </p>
            <div dir="ltr" className="flex flex-row gap-2 justify-center mb-4">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  placeholder="0"
                  className="w-12 h-12 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  maxLength={1}
                  dir="ltr"
                />
              ))}
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowOTPDialog(false);
                  setOtpDigits(["", "", "", ""]);
                  setError("");
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleVerifyDeleteOTP}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? t("common.loading") : t("settingsPage.deleteAccount")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900">
              {t("settingsPage.accountDeletedTitle")}
            </h2>
            <p className="text-gray-600 mb-6">
              {t("settingsPage.accountDeletedMessage")}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              {t("settingsPage.goToLogin")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
