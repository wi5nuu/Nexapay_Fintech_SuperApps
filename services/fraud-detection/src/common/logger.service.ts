import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'fraud-detection' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}] ${message}${metaStr}`;
            }),
          ),
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

  fatal(message: string, ...optionalParams: unknown[]): void {
    this.logger.error(`FATAL: ${message}`, ...optionalParams);
  }
}
