import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor for logging all incoming requests to the Wallet service.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('WalletService');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${url} | Body: ${JSON.stringify(body)} | Duration: ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
