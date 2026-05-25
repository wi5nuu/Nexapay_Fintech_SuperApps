import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WalletLogger } from '../logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: WalletLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as Record<string, unknown>).message ?? message,
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
        'HttpExceptionFilter',
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} -> ${status}: ${JSON.stringify(errorResponse.message)}`,
        'HttpExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}
