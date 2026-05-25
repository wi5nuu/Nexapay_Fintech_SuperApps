import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'investment-service' },
      transports: [
        new winston.transports.Console({
          format:
            process.env.NODE_ENV !== 'production'
              ? winston.format.combine(
                  winston.format.colorize(),
                  winston.format.printf(
                    ({ timestamp, level, message, context, ...rest }) => {
                      const ctx = context ? `[${context}]` : '';
                      const extra =
                        Object.keys(rest).length > 0
                          ? ` ${JSON.stringify(rest)}`
                          : '';
                      return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                    },
                  ),
                )
              : winston.format.json(),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10 * 1024 * 1024,
          maxFiles: 10,
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
