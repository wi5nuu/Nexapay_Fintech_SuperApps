import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor(context?: string) {
    const isProd = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: isProd ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: {
        service: 'auth-service',
        context: context ?? 'Application',
      },
      transports: [
        new winston.transports.Console({
          format: isProd
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context: ctx, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `${timestamp} [${ctx ?? context ?? 'Application'}] ${level}: ${message}${metaStr}`;
                }),
              ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 10,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 10,
        }),
      ],
    });
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.logger.warn(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    this.logger.verbose(message, ...optionalParams);
  }

  setContext(context: string): void {
    this.logger.defaultMeta = {
      ...this.logger.defaultMeta,
      context,
    };
  }
}
