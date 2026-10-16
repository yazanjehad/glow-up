import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private notificationsService: NotificationsService,
    private jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        this.logger.warn('Client connected without token. Disconnecting.');
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      client.data.userId = payload.sub || payload.userId;
      this.logger.log(`User connected: ${client.data.userId}`);
    } catch (error) {
      this.logger.error('Authentication error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    client.join(conversationId);
    this.logger.log(`User ${client.data.userId} joined room: ${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; text: string; conversationId?: string; type?: string; appointmentId?: string },
  ) {
    try {
      const senderId = client.data.userId;
      if (!senderId) throw new WsException('Unauthorized: No sender ID found in socket data.');

      const conversation = await this.chatService.findOrCreateConversation([senderId, data.toUserId]);
      const convId = conversation._id.toString();

      client.join(convId);

      const recipientId = conversation.participants.find(p => p.toString() !== senderId)?.toString();
      if (!recipientId) throw new WsException('Recipient not found in conversation.');

      const message = await this.chatService.createMessage(
        convId,
        senderId,
        data.text,
        data.type || 'text',
        data.appointmentId,
      );

      this.server.to(convId).emit('newMessage', message);

      try {
        await this.notificationsService.notifyUser(
          recipientId,
          { ar: 'رسالة جديدة', en: 'New message' },
          { ar: data.text, en: data.text },
          'chat' as any,
          convId,
        );
      } catch (e) {
        this.logger.warn(`Push Notification failed for ${recipientId}: ${e.message}`);
      }

      return message;
    } catch (error) {
      this.logger.error(`Error in handleSendMessage: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = client.data.userId;
    await this.chatService.markAsRead(conversationId, userId);

    this.server.to(conversationId).emit('messagesRead', {
      conversationId,
      userId,
    });
  }
}
