import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { LoggerService } from '../logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          this.logger.log(`${method} ${url} ${response.statusCode} - ${duration}ms`, {
            method,
            url,
            statusCode: response.statusCode,
            duration,
            ip,
            userAgent: request.headers['user-agent'] ?? undefined,
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`${method} ${url} - ${duration}ms`, {
            method,
            url,
            duration,
            ip,
            error: error.message,
          });
        },
      }),
    );
  }
}
