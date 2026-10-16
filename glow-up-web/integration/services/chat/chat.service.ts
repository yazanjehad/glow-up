import { get } from "@/integration/http/http.client";


export type ParticipantRef = string | { _id: string; name?: string };

export type SalonInfoDto = {
  name: string;
  coverImage?: string;
};

export type CustomerInfoDto = {
  name?: string;
  image?: string;
};

export type ConversationDto = {
  _id: string;
  participants: ParticipantRef[];
  appointmentId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  salonInfo?: SalonInfoDto;
  customerInfo?: CustomerInfoDto;
};

export type MessageDto = {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export const ChatService = {
  getConversations: () => get<ConversationDto[]>("/chat/conversations"),
  findWith: (targetUserId: string) =>
    get<ConversationDto>(`/chat/find-with/${targetUserId}`),
  getMessages: (conversationId: string) =>
    get<MessageDto[]>(`/chat/messages/${conversationId}`),
};