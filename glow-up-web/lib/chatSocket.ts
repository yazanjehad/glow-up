import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const CHAT_NAMESPACE = "/chat";

export function getChatSocket(token: string): Socket {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}${CHAT_NAMESPACE}`, {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
}


export function joinChatRoom(socket: Socket, conversationId: string): void {
  socket.emit("joinRoom", { conversationId });
}


export function sendChatMessage(socket: Socket, toUserId: string, text: string): void {
  socket.emit("sendMessage", { toUserId, text });
}


export function markChatAsRead(socket: Socket, conversationId: string): void {
  socket.emit("markAsRead", conversationId);
}