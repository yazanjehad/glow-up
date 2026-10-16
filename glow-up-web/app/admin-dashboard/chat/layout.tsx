"use client";

import { useTranslation } from "react-i18next";
import AdminChatSidebar from "@/components/chat/AdminChatSidebar";

export default function AdminDashboardChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div
      className="flex min-h-0 flex-1 flex-row overflow-hidden bg-gray-50"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <main className="order-1 rtl:order-2 flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <AdminChatSidebar />
    </div>
  );
}
