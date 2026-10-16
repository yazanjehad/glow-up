import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove socket from userSockets
    for (const [userId, socketIds] of this.userSockets.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }

    const sockets = this.userSockets.get(userId);
    if (sockets && !sockets.includes(client.id)) {
      sockets.push(client.id);
    }

    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} joined their notification room`);

    return { event: 'joined', data: { userId } };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
      }
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      }
    }

    client.leave(`user:${userId}`);
    this.logger.log(`User ${userId} left their notification room`);

    return { event: 'left', data: { userId } };
  }

  // Send notification to a specific user
  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.log(`Sent ${event} to user ${userId}`);
  }

  // Send notification to multiple users
  sendToUsers(userIds: string[], event: string, data: unknown) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
}
