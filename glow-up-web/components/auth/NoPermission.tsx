"use client";

import { useTranslation } from "react-i18next";
import { ShieldX, Eye } from "lucide-react";

// Types for specific view permission messages
export type NoPermissionType = 
  | "ads" 
  | "lookups" 
  | "tickets" 
  | "salons" 
  | "plans" 
  | "bookings" 
  | "coupons" 
  | "users"
  | "general";

interface NoPermissionProps {
  title?: string;
  message?: string;
  type?: NoPermissionType;
}

export function NoPermission({ title, message, type }: NoPermissionProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get specific message based on type (for view-only restrictions)
  const getTitle = () => {
    if (title) return title;
    if (type && type !== "general") {
      return t(`noPermission.viewTitle.${type}`, t("noPermission.viewTitle.default"));
    }
    return t("noPermission.title");
  };

  const getMessage = () => {
    if (message) return message;
    if (type && type !== "general") {
      return t(`noPermission.viewMessage.${type}`, t("noPermission.viewMessage.default"));
    }
    return t("noPermission.message");
  };

  // Use Eye icon for view-specific restrictions, ShieldX for general
  const Icon = type && type !== "general" ? Eye : ShieldX;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex flex-col items-center justify-center min-h-[300px] p-8"
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {getTitle()}
      </h2>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {getMessage()}
      </p>
    </div>
  );
}
