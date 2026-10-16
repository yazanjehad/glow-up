"use client";

import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";

export default function AdminDashboardChatInboxPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 md:p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
        <MessageCircle className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
        <p className="text-center text-gray-400 text-sm">{t("chat.noMessages")}</p>
        <p className="text-center text-gray-400 text-xs">{t("chat.selectConversation")}</p>
      </div>
    </div>
  );
}
