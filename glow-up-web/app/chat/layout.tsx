"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import Layout from "@/components/Layout";
import { getToken } from "@/integration/services/auth/authServices";
import ChatSidebar from "@/components/chat/ChatSidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const pathname = usePathname();
  const isConversationActive = (pathname ?? "").split("/").length > 2;

  useEffect(() => {
    const t = setTimeout(() => {
      if (!getToken()) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/chat")}`);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Layout>
      <div
        className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] min-h-0 flex-row overflow-hidden bg-gray-50"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <ChatSidebar className={isConversationActive ? "hidden md:flex" : "flex w-full md:w-[320px]"} />
        
        <main className={`order-1 rtl:order-2 flex min-h-0 flex-1 flex-col overflow-hidden ${!isConversationActive ? "hidden md:flex" : "flex"}`}>
          {children}
        </main>
      </div>
    </Layout>
  );
}
