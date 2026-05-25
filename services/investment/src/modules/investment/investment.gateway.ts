import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { LoggerService } from '../../common/logger.service';

interface PriceUpdate {
  productId: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

@WebSocketGateway({
  namespace: '/investments',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  },
})
export class InvestmentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private redisSubscriber: Redis | null = null;
  private redisPublisher: Redis | null = null;

  constructor(private readonly logger: LoggerService) {
    this.initRedis();
  }

  private initRedis(): void {
    try {
      const redisUri = process.env.REDIS_URI ?? 'redis://localhost:6379';

      this.redisSubscriber = new Redis(redisUri);
      this.redisPublisher = new Redis(redisUri);

      this.redisSubscriber.subscribe('price:updates', (err, count) => {
        if (err) {
          this.logger.error(
            `Redis subscribe error: ${err.message}`,
            err.stack,
            'InvestmentGateway',
          );
          return;
        }
        this.logger.log(
          `Subscribed to price:updates (${count} channels)`,
          'InvestmentGateway',
        );
      });

      this.redisSubscriber.on('message', (channel: string, message: string) => {
        if (channel === 'price:updates') {
          try {
            const data: PriceUpdate = JSON.parse(message);
            this.server.emit('priceUpdate', data);
          } catch (parseErr) {
            this.logger.error(
              `Invalid JSON on price:updates: ${message}`,
              undefined,
              'InvestmentGateway',
            );
          }
        }
      });
    } catch (error) {
      this.logger.warn(
        `Redis unavailable, WebSocket pub/sub disabled: ${(error as Error).message}`,
        'InvestmentGateway',
      );
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`, 'InvestmentGateway');
    client.emit('connected', {
      message: 'Connected to NexaPay Investment Feed',
      timestamp: new Date().toISOString(),
    });
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`, 'InvestmentGateway');
  }

  @SubscribeMessage('subscribe:product')
  async handleSubscribeProduct(
    client: Socket,
    payload: { productId: string },
  ): Promise<void> {
    const room = `product:${payload.productId}`;
    await client.join(room);
    this.logger.log(
      `Client ${client.id} subscribed to ${room}`,
      'InvestmentGateway',
    );
    client.emit('subscribed', { room, productId: payload.productId });
  }

  @SubscribeMessage('unsubscribe:product')
  async handleUnsubscribeProduct(
    client: Socket,
    payload: { productId: string },
  ): Promise<void> {
    const room = `product:${payload.productId}`;
    await client.leave(room);
    this.logger.log(
      `Client ${client.id} unsubscribed from ${room}`,
      'InvestmentGateway',
    );
    client.emit('unsubscribed', { room, productId: payload.productId });
  }

  async publishPriceUpdate(update: PriceUpdate): Promise<void> {
    if (this.redisPublisher) {
      try {
        await this.redisPublisher.publish(
          'price:updates',
          JSON.stringify(update),
        );
      } catch (error) {
        this.logger.error(
          `Failed to publish price update: ${(error as Error).message}`,
          undefined,
          'InvestmentGateway',
        );
      }
    }
  }
}
