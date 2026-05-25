import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString(),
  });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn({
      message: 'Application error',
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    });
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err.name === 'SyntaxError' && 'body' in err) {
    logger.warn({ message: 'Invalid JSON in request body' });
    res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Invalid JSON in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.error({
    message: 'Unhandled error',
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV !== 'production'
        ? err.message
        : 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
}
