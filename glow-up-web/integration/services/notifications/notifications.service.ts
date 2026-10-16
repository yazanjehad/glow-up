import { get, put } from "@/integration/http/http.client";

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  page: number;
}
export interface NotificationRaw {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  status: string;
  type: string;
  relatedEntityId?: string;
  data?: {
    salonId?: string;
    providerId?: string;
    appointmentId?: string;
    conversationId?: string;
    bookingId?: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  status: string;
  type: string;
  relatedEntityId?: string;
  data?: {
    salonId?: string;
    providerId?: string;
    appointmentId?: string;
    conversationId?: string;
    bookingId?: string;
  };
}

interface NotificationListResponseRaw {
  notifications: NotificationRaw[];
  total: number;
  limit: number;
  page: number;
}

function mapNotification(raw: NotificationRaw): Notification {
  return {
    id: raw._id,
    title: raw.title,
    message: raw.message,
    createdAt: raw.createdAt,
    status: raw.status,
    type: raw.type,
    relatedEntityId: raw.relatedEntityId,
    data: raw.data,
  };
}

export const NotificationsService = {
  getUnreadCount: async () => get<UnreadCountResponse>("/notifications/unread-count"),
  getNotifications: async (): Promise<{ data: NotificationListResponse }> => {
    const res = await get<NotificationListResponseRaw>("/notifications");
    return {
      data: {
        notifications: (res.data?.notifications || []).map(mapNotification),
        total: res.data?.total || 0,
        limit: res.data?.limit || 20,
        page: res.data?.page || 1,
      },
    };
  },
  readNotification: (id: string) => put(`/notifications/${id}/read`),
  readAllNotifications: () => put(`/notifications/read-all`),
};