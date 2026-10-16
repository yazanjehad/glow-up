"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getChatList, type ChatListItem } from "@/lib/chatListStorage";
import { MessageCircle } from "lucide-react";

const DEFAULT_SALON_IMG =
  "https://t4.ftcdn.net/jpg/06/53/00/35/240_F_653003534_TvjtsbAWKpEkwcqVpkOnFqOmIyCkqSyT.jpg";

export default function ChatSidebar({ className = "" }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const pathname = usePathname();
  const currentSalonId = pathname?.startsWith("/chat/") ? pathname.replace("/chat/", "").split("/")[0] : null;
  const [list, setList] = useState<ChatListItem[]>([]);

  useEffect(() => {
    setList(getChatList());
  }, [pathname]);

  useEffect(() => {
    const onUpdate = () => setList(getChatList());
    window.addEventListener("chat-list-updated", onUpdate);
    return () => window.removeEventListener("chat-list-updated", onUpdate);
  }, []);

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className={`order-2 rtl:order-1 shrink-0 border-s border-gray-200 bg-white ${className}`}
    >
      <div className="flex h-full w-full min-h-0 flex-col p-4 pt-4 md:p-6 md:pt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          {t("chat.pageTitle")}
        </h2>
        {list.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center rounded-xl bg-gray-50 py-8 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-2 text-sm text-gray-500">{t("chat.noConversations")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {list.map((chat) => {
              const img =
                chat.salonImage?.startsWith("http") ? chat.salonImage : DEFAULT_SALON_IMG;
              const isActive = currentSalonId === chat.salonId;
              return (
                <li key={chat.salonId}>
                  <Link
                    href={`/chat/${chat.salonId}`}
                    className={`flex items-center gap-3 rounded-xl p-2.5 transition ${
                      isActive
                        ? "bg-[#E6F4EA] text-[#7BAE6A]"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{chat.salonName}</p>
                      {chat.lastMessage ? (
                        <p className="truncate text-xs text-gray-500">{chat.lastMessage}</p>
                      ) : (
                        <p className="text-xs text-gray-400">{t("chat.noMessages")}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
