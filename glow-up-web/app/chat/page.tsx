"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getToken } from "@/integration/services/auth/authServices";
import { getChatList, type ChatListItem } from "@/lib/chatListStorage";
import { MessageCircle } from "lucide-react";

export default function ChatListPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const router = useRouter();
  const [list, setList] = useState<ChatListItem[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!getToken()) {
        router.replace(`/login?returnUrl=${encodeURIComponent("/chat")}`);
        return;
      }
      const chatList = getChatList();
      setList(chatList);
      
      // Auto-select first conversation if available
      if (chatList.length > 0 && chatList[0].salonId) {
        router.replace(`/chat/${chatList[0].salonId}`);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col p-4 md:p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {list.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F4EA]">
            <MessageCircle className="h-8 w-8 text-[#7BAE6A]" strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-center text-gray-600">{t("chat.noConversations")}</p>
          <p className="mt-1 text-center text-sm text-gray-400">{t("chat.noConversationsHint")}</p>
          <Link
            href="/home"
            className="mt-6 rounded-xl bg-[#7BAE6A] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {t("chat.browseSalons")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
          <MessageCircle className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
          <p className="mt-4 text-center text-gray-500">{t("chat.selectConversation")}</p>
          <p className="mt-1 text-center text-sm text-gray-400">
            {t("chat.noConversationsHint")}
          </p>
        </div>
      )}
    </div>
  );
}
