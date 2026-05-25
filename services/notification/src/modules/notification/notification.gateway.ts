import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggerService } from '../../common/logger.service';

interface AuthPayload {
  userId: string;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: '*', credentials: true },
  path: process.env.WS_PATH ?? '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly logger: LoggerService) {}

  handleConnection(client: Socket): void {
    const userId = client.handshake.query.userId as string | undefined;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`, NotificationGateway.name);
    } else {
      client.disconnect();
      this.logger.warn(`Client rejected — no userId: ${client.id}`, NotificationGateway.name);
    }
  }

  handleDisconnect(client: Socket): void {
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.delete(client.id)) {
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`, NotificationGateway.name);
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() payload: AuthPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`user:${payload.userId}`);
    this.logger.log(`User ${payload.userId} authenticated on socket ${client.id}`, NotificationGateway.name);
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
