"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getProviderId, getCurrentUserId } from "@/integration/services/auth/authServices";
import { ChatService, type ConversationDto, type ParticipantRef } from "@/integration/services/chat/chat.service";
import { MessageCircle } from "lucide-react";

const DEFAULT_AVATAR =
  "https://t4.ftcdn.net/jpg/06/53/00/35/240_F_653003534_TvjtsbAWKpEkwcqVpkOnFqOmIyCkqSyT.jpg";

function getParticipantId(p: ParticipantRef): string {
  return typeof p === "string" ? p : p._id;
}

function getCustomerDisplayName(conv: ConversationDto, lang: string): string {
  const name = conv.customerInfo?.name?.trim();
  if (name) return name;
  return lang === "ar" ? "زبون" : "Customer";
}

function getCustomerImage(conv: ConversationDto): string {
  const img = conv.customerInfo?.image?.trim();
  if (img && img.startsWith("http")) return img;
  return DEFAULT_AVATAR;
}

export default function AdminChatSidebar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const pathname = usePathname();
  const currentConvId = pathname?.startsWith("/admin-dashboard/chat/")
    ? pathname.replace("/admin-dashboard/chat/", "").split("/")[0]
    : null;
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const providerId = getProviderId();
  const currentUserId = getCurrentUserId();

  const fetchConversations = () => {
    if (!providerId) return;
    ChatService.getConversations()
      .then((res) => {
        const list = res.data ?? [];
        list.sort((a, b) => {
          const ta = a.lastMessageAt ?? a.updatedAt ?? a.createdAt ?? "";
          const tb = b.lastMessageAt ?? b.updatedAt ?? b.createdAt ?? "";
          return tb.localeCompare(ta);
        });
        const seenCustomerIds = new Set<string>();
        const deduped = list.filter((conv) => {
          const otherId = conv.participants
            .map(getParticipantId)
            .find((id) => id !== providerId && id !== currentUserId);
          if (!otherId || seenCustomerIds.has(otherId)) return false;
          seenCustomerIds.add(otherId);
          return true;
        });
        setConversations(deduped);
      })
      .catch(() => setConversations([]));
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, providerId]);

  useEffect(() => {
    const onUpdate = () => fetchConversations();
    window.addEventListener("admin-chat-list-updated", onUpdate);
    return () => window.removeEventListener("admin-chat-list-updated", onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  return (
    <aside
      dir={isRTL ? "rtl" : "ltr"}
      className="order-2 rtl:order-1 w-full shrink-0 border-s border-gray-200 bg-white md:w-[320px]"
    >
      <div className="flex h-full min-h-0 flex-col p-4 pt-4 md:p-6 md:pt-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          {t("chat.pageTitle")}
        </h2>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-8 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-2 text-sm text-gray-500">{t("chat.noConversations")}</p>
          </div>
        ) : (
          <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {conversations.map((conv) => {
              const displayName = getCustomerDisplayName(conv, i18n.language);
              const avatarSrc = getCustomerImage(conv);
              const isActive = currentConvId === conv._id;
              return (
                <li key={conv._id}>
                  <Link
                    href={`/admin-dashboard/chat/${conv._id}`}
                    className={`flex items-center gap-3 rounded-xl p-2.5 transition ${
                      isActive ? "bg-[#E6F4EA] text-[#7BAE6A]" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      <Image
                        src={avatarSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
                      {conv.lastMessage ? (
                        <p className="truncate text-xs text-gray-500">{conv.lastMessage}</p>
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
