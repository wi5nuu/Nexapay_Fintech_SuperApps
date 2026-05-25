import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware, Options as ProxyOptions } from 'http-proxy-middleware';
import winston from 'winston';
import { apiRateLimiter as rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { requestIdMiddleware } from './middleware/request-id';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { startGateway } from './graphql/gateway';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV !== 'production'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : undefined,
    }),
  ],
});

const app = express();
const PORT = parseInt(process.env.PORT ?? '4000', 10);

const CORS_WHITELIST: string[] = (
  process.env.CORS_ORIGINS ?? 'http://localhost:4200,http://localhost:8100,http://localhost:5173'
).split(',').map((s: string) => s.trim());

const SERVICE_TARGETS: Record<string, string> = {
  '/api/v1/auth': process.env.AUTH_SERVICE_URL ?? 'http://auth:4001',
  '/api/v1/users': process.env.USER_KYC_SERVICE_URL ?? 'http://user-kyc:4002',
  '/api/v1/wallets': process.env.WALLET_SERVICE_URL ?? 'http://wallet:4003',
  '/api/v1/loans': process.env.LOAN_SERVICE_URL ?? 'http://loan:4004',
  '/api/v1/investments': process.env.INVESTMENT_SERVICE_URL ?? 'http://investment:4005',
  '/api/v1/notifications': process.env.NOTIFICATION_SERVICE_URL ?? 'http://notification:4006',
  '/api/v1/reports': process.env.REPORTING_SERVICE_URL ?? 'http://reporting:4007',
  '/api/v1/fraud': process.env.FRAUD_SERVICE_URL ?? 'http://fraud-detection:4008',
};

const PUBLIC_PATHS: string[] = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh',
  '/health',
  '/healthz',
  '/metrics',
];

// --- Global Middleware ---
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || CORS_WHITELIST.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization', 'Content-Type', 'Idempotency-Key',
    'X-Request-Id', 'X-Idempotency-Key', 'X-CSRF-Token',
  ],
  exposedHeaders: ['X-Request-Id', 'X-Balance', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// --- Rate Limiting ---
app.use(rateLimitMiddleware);

// --- Request Logging ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') ?? '0',
      userAgent: (req.headers['user-agent'] ?? '').substring(0, 100),
      ip: req.ip ?? req.socket.remoteAddress,
    });
  });
  next();
});

// --- Health Checks ---
app.get('/health', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  let allHealthy = true;

  for (const [prefix, target] of Object.entries(SERVICE_TARGETS)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${target}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      checks[prefix] = response.ok ? 'healthy' : 'unhealthy';
      if (!response.ok) allHealthy = false;
    } catch {
      checks[prefix] = 'unhealthy';
      allHealthy = false;
    }
  }

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).type('text/plain').send('ok');
});

app.get('/metrics', (_req: Request, res: Response) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    connections: 0,
    requestsTotal: 0,
  });
});

// --- Proxy Routes ---
const proxyOptions: ProxyOptions = {
  changeOrigin: true,
  proxyTimeout: 30_000,
  timeout: 30_000,
  on: {
    proxyReq: (proxyReq, req: Request) => {
      proxyReq.setHeader('X-Request-Id', req.requestId);
      proxyReq.setHeader('X-Forwarded-For', req.ip ?? 'unknown');
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.hostname ?? '');
    },
    proxyRes: (proxyRes, req: Request) => {
      proxyRes.headers['x-request-id'] = req.requestId;
      proxyRes.headers['x-powered-by'] = 'NexaPay';
    },
    error: (err: Error, _req: Request, res: Response) => {
      logger.error({ message: 'Proxy error', error: err.message, code: (err as NodeJS.ErrnoException).code });
      if (!res.headersSent) {
        res.status(502).json({
          error: 'BAD_GATEWAY',
          message: 'Upstream service unavailable',
          requestId: _req.requestId,
        });
      }
    },
  },
};

for (const [prefix, target] of Object.entries(SERVICE_TARGETS)) {
  app.use(
    prefix,
    (req: Request, _res: Response, next: NextFunction) => {
      const isPublic = PUBLIC_PATHS.some((p) => req.originalUrl.startsWith(p));
      if (!isPublic) {
        return authMiddleware(req, _res, next);
      }
      next();
    },
    createProxyMiddleware({ ...proxyOptions, target }),
  );
}

// --- 404 Handler ---
app.use(notFoundHandler);

// --- Global Error Handler ---
app.use(errorHandler);

// --- Start BFF Server ---
app.listen(PORT, () => {
  logger.info(`NexaPay API Gateway BFF listening on port ${PORT}`);
  logger.info(`CORS whitelist: ${CORS_WHITELIST.join(', ')}`);
  Object.entries(SERVICE_TARGETS).forEach(([prefix, target]) => {
    logger.info(`Proxy: ${prefix.padEnd(25)} -> ${target}`);
  });
  logger.info(`Public paths: ${PUBLIC_PATHS.join(', ')}`);
});

// --- Start GraphQL Gateway ---
startGateway().catch((err: Error) => {
  logger.error(`GraphQL Gateway failed to start: ${err.message}`);
});

export default app;
