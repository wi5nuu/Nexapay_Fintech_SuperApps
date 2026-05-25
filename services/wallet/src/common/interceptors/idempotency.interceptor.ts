import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { WalletLogger } from '../logger.service';

export const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';
const IDEMPOTENCY_TTL = 86400;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly redis: Redis;

  constructor(
    private readonly reflector: Reflector,
    private readonly logger: WalletLogger,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      keyPrefix: 'idempotency:',
    });
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey: string | undefined =
      request.headers[IDEMPOTENCY_KEY_HEADER] ?? request.body?.idempotencyKey;

    if (!idempotencyKey) {
      return next.handle();
    }

    const existingResponse = await this.redis.get(idempotencyKey);

    if (existingResponse) {
      this.logger.warn(
        `Idempotency key ${idempotencyKey} replayed for ${request.method} ${request.url}`,
        'IdempotencyInterceptor',
      );
      const parsed = JSON.parse(existingResponse);
      throw new ConflictException({
        message: 'Idempotency conflict: request already processed',
                previousResponse: parsed,
      });
    }

    return new Observable((subscriber) => {
      next.handle().subscribe({
        next: (data: unknown) => {
          this.redis
            .setex(idempotencyKey, IDEMPOTENCY_TTL, JSON.stringify(data))
            .catch((err: Error) =>
              this.logger.error('Failed to cache idempotency response', err.stack, 'IdempotencyInterceptor'),
            );
          subscriber.next(data);
        },
        error: (err: Error) => {
          subscriber.error(err);
        },
        complete: () => {
          subscriber.complete();
        },
      });
    });
  }
}
