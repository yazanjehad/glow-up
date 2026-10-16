

const STORAGE_KEY = "glow-up-chat-list";

export type ChatListItem = {
  salonId: string;
  salonName: string;
  salonImage?: string;
  lastMessage?: string;
  lastOpenedAt: string; 
};

export function getChatList(): ChatListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatListItem[];
    const list = Array.isArray(parsed) ? parsed : [];
    const sorted = [...list].sort((a, b) => (b.lastOpenedAt > a.lastOpenedAt ? 1 : -1));
    const bySalon = new Map<string, ChatListItem>();
    for (const item of sorted) {
      if (!item.salonId) continue;
      if (!bySalon.has(item.salonId)) bySalon.set(item.salonId, item);
    }
    return Array.from(bySalon.values()).sort((a, b) =>
      b.lastOpenedAt > a.lastOpenedAt ? 1 : -1
    );
  } catch {
    return [];
  }
}

export type AddOrUpdateChatOptions = {
  setLastOpenedNow?: boolean;
};

export function addOrUpdateChat(
  item: Omit<ChatListItem, "lastOpenedAt"> & { lastMessage?: string },
  options?: AddOrUpdateChatOptions
): void {
  const list = getChatList();
  const now = new Date().toISOString();
  const existing = list.findIndex((c) => c.salonId === item.salonId);
  const shouldUpdateOpenedAt =
    existing < 0 ? true : (options?.setLastOpenedNow === true);
  const entry: ChatListItem = {
    ...item,
    lastOpenedAt: shouldUpdateOpenedAt ? now : list[existing].lastOpenedAt,
    ...(item.lastMessage !== undefined && { lastMessage: item.lastMessage }),
  };
  let next: ChatListItem[];
  if (existing >= 0) {
    next = [...list];
    next[existing] = { ...next[existing], ...entry };
  } else {
    next = [entry, ...list];
  }
  next.sort((a, b) => (b.lastOpenedAt > a.lastOpenedAt ? 1 : -1));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
  }
}
