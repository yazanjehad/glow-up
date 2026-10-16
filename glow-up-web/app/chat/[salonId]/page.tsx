"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getToken, getCurrentUserId } from "@/integration/services/auth/authServices";
import { ServiceProvider } from "@/integration/services/provider/providerService";
import type { SalonUi } from "@/integration/services/provider/provider.types";
import { ChatService } from "@/integration/services/chat/chat.service";
import { getChatSocket, joinChatRoom, sendChatMessage, markChatAsRead } from "@/lib/chatSocket";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import CenterGreenLoader from "@/components/ui/CenterGreenLoader";
import { addOrUpdateChat } from "@/lib/chatListStorage";

type ChatMessage = {
  id: string;
  text: string;
  sender: "me" | "salon";
  createdAt: Date;
  isRead?: boolean;
};

function getParticipantId(p: string | { _id: string }): string {
  return typeof p === "string" ? p : p._id;
}

export default function ChatWithSalonPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const params = useParams<{ salonId: string }>();
  const salonId = params?.salonId as string | undefined;
  const router = useRouter();

  const [salon, setSalon] = useState<SalonUi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myParticipantIdRef = useRef<string | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !salonId || !conversationId) return;
    const token = getToken();
    if (!token) return;

    const newMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      text,
      sender: "me",
      createdAt: new Date(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    if (salon) {
      const img = salon.coverImage?.startsWith("http") ? salon.coverImage : undefined;
      addOrUpdateChat(
        {
          salonId: salon.id,
          salonName: salon.name ?? "",
          salonImage: img,
          lastMessage: text,
        },
        { setLastOpenedNow: false }
      );
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("chat-list-updated"));
    }

    const socket = getChatSocket(token);
    sendChatMessage(socket, salonId, text);
  };

  useEffect(() => {
    if (!salonId) {
      setLoading(false);
      return;
    }
    if (!getToken()) {
      router.replace(`/login?returnUrl=${encodeURIComponent(`/chat/${salonId}`)}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ServiceProvider.getById(salonId);
        if (!cancelled) {
          setSalon(data);
          addOrUpdateChat(
            {
              salonId,
              salonName: data.name ?? "",
              salonImage: data.coverImage?.startsWith("http") ? data.coverImage : undefined,
            },
            { setLastOpenedNow: true }
          );
        }
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message ?? "Failed to load salon");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [salonId, router]);

  useEffect(() => {
    if (!salonId || !getToken() || loading || error || !salon) return;

    const token = getToken();
    const myId = getCurrentUserId();
    const convIdRef = { current: null as string | null };
    let cancelled = false;

    const socket = getChatSocket(token);

    const onConnect = () => {
      const cid = convIdRef.current;
      if (!cid) return;
      joinChatRoom(socket, cid);
      markChatAsRead(socket, cid);
    };

    const onNewMessage = (msg: { _id?: string; text: string; senderId: string; conversationId?: string }) => {
      const cid = convIdRef.current;
      const myPid = myParticipantIdRef.current;
      if (!cid || (msg.conversationId && msg.conversationId !== cid)) return;
      if (myPid && String(msg.senderId) === String(myPid)) return;

      setMessages((prev) => {
        if (msg._id && prev.some((m) => m.id === msg._id)) return prev;
        return [
          ...prev,
          {
            id: msg._id ?? `new-${Date.now()}`,
            text: msg.text,
            sender: "salon",
            createdAt: new Date(),
            isRead: false,
          },
        ];
      });
      markChatAsRead(socket, cid);
    };

    const onMessagesRead = (data: { conversationId?: string }) => {
      const cid = convIdRef.current;
      if (cid && data.conversationId === cid) {
        setMessages((prev) =>
          prev.map((m) => (m.sender === "me" ? { ...m, isRead: true } : m))
        );
      }
    };

    socket.on("connect", onConnect);
    socket.on("newMessage", onNewMessage);
    socket.on("messagesRead", onMessagesRead);

    (async () => {
      try {
        const convRes = await ChatService.findWith(salonId);
        const conv = convRes.data;
        if (!conv || cancelled) return;
        const participantIds = conv.participants.map(getParticipantId);
        const salonParticipantId = participantIds.find((id) => String(id) === String(salonId)) ?? participantIds[0];
        const myPid =
          participantIds.find((id) => myId && String(id) === String(myId)) ??
          participantIds.find((id) => id !== salonParticipantId) ??
          participantIds[0];
        myParticipantIdRef.current = myPid ?? null;

        convIdRef.current = conv._id;
        setConversationId(conv._id);

        const msgsRes = await ChatService.getMessages(conv._id);
        const msgs = msgsRes.data ?? [];
        if (cancelled) return;
        setMessages(
          msgs.map((m: { _id: string; text: string; senderId: string; createdAt: string; isRead?: boolean }) => ({
            id: m._id,
            text: m.text,
            sender: myPid && String(m.senderId) === String(myPid) ? "me" : "salon",
            createdAt: new Date(m.createdAt),
            isRead: myPid && String(m.senderId) === String(myPid) ? (m.isRead ?? false) : undefined,
          }))
        );

        if (socket.connected) {
          joinChatRoom(socket, conv._id);
          markChatAsRead(socket, conv._id);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message ?? "Failed to load chat");
      }
    })();

    const refetchMessages = async () => {
      if (!convIdRef.current || cancelled) return;
      const cid = convIdRef.current;
      const myPid = myParticipantIdRef.current;
      if (!myPid) return;
      try {
        const msgsRes = await ChatService.getMessages(cid);
        const msgs = msgsRes.data ?? [];
        if (cancelled) return;
        setMessages(
          msgs.map((m: { _id: string; text: string; senderId: string; createdAt: string; isRead?: boolean }) => ({
            id: m._id,
            text: m.text,
            sender: String(m.senderId) === String(myPid) ? "me" : "salon",
            createdAt: new Date(m.createdAt),
            isRead: String(m.senderId) === String(myPid) ? (m.isRead ?? false) : undefined,
          }))
        );
      } catch {
        // ignore
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refetchMessages();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const pollInterval = setInterval(refetchMessages, 5000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket.off("connect", onConnect);
      socket.off("newMessage", onNewMessage);
      socket.off("messagesRead", onMessagesRead);
    };
  }, [salonId, loading, error, salon]);

  if (!salonId) {
    return (
      <div className="p-4">
        <p className="text-gray-500">{t("chat.noMessages")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-4">
        <CenterGreenLoader label={t("loading")} />
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="p-4" dir={isRTL ? "rtl" : "ltr"}>
        <p className="text-red-500">{error ?? "Salon not found"}</p>
        <Link
          href={`/salon/${salonId}`}
          className="mt-4 inline-flex items-center gap-2 text-[#7BAE6A] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("chat.backToSalon")}
        </Link>
      </div>
    );
  }

  const salonImage =
    salon.coverImage?.startsWith("http")
      ? salon.coverImage
      : "https://t4.ftcdn.net/jpg/06/53/00/35/240_F_653003534_TvjtsbAWKpEkwcqVpkOnFqOmIyCkqSyT.jpg";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col p-4 md:p-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mb-4 flex shrink-0 items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <Link
          href={`/salon/${salonId}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
          aria-label={t("chat.backToSalon")}
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
          <Image
            src={salonImage}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-gray-900">
            {salon.name}
          </h1>
          <p className="truncate text-sm text-gray-500">
            {salon.location ?? salon.city ?? ""}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        <div
          dir="ltr"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 bg-[#f4f7f9]"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
              <p className="text-center text-gray-400 text-sm">{t("chat.noMessages")}</p>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-4">
              {messages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full gap-2 ${isMe ? "justify-end flex-row" : "justify-start"}`}
                  >
                    {!isMe && (
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-200 mt-1">
                        <Image
                          src={salonImage}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                        ? "bg-[#7BAE6A] text-white rounded-tr-none"
                        : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                        }`}
                    >
                      <p className={`text-[15px] leading-relaxed break-words ${isRTL ? "text-right" : "text-left"}`}>
                        {msg.text}
                      </p>
                      <div className={`flex items-center gap-1.5 mt-1 ${isMe ? "text-white/90 justify-end" : "text-gray-400"}`}>
                        <span className="text-[10px]">
                          {msg.createdAt.toLocaleTimeString(i18n.language === "ar" ? "ar-SA" : "en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </span>
                        {isMe && (
                          <span className="text-[10px] flex items-center gap-0.5" title={msg.isRead ? (i18n.language === "ar" ? "مقروء" : "Read") : ""}>
                            {msg.isRead ? (
                              <CheckCheck className="h-3.5 w-3.5 text-white/80" strokeWidth={2.5} />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-white/80 opacity-90" strokeWidth={2.5} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-gray-100 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <input
              type="text"
              placeholder={t("chat.typeMessage")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400 py-2"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() || !conversationId}
              className="rounded-xl bg-[#7BAE6A] p-2.5 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              aria-label={t("chat.send")}
            >
              <Send className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
