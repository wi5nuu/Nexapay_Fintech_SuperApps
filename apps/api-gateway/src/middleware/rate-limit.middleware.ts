import rateLimit, { RateLimitRequestHandler, Options as RateLimitOptions } from "express-rate-limit";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 100;
const DEFAULT_MESSAGE = { error: "TOO_MANY_REQUESTS", message: "Too many requests, please try again later" };

export const createRateLimiter = (options?: Partial<RateLimitOptions>): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: options?.windowMs ?? DEFAULT_WINDOW_MS,
    max: options?.max ?? DEFAULT_MAX,
    standardHeaders: options?.standardHeaders ?? true,
    legacyHeaders: options?.legacyHeaders ?? false,
    message: options?.message ?? DEFAULT_MESSAGE,
    keyGenerator: options?.keyGenerator ?? ((req) => {
      return req.headers["x-forwarded-for"] as string ?? req.ip ?? "unknown";
    }),
    skip: options?.skip ?? ((_req) => false),
    handler: options?.handler,
    ...options,
  });
};

export const authRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  message: { error: "TOO_MANY_REQUESTS", message: "Too many authentication attempts" },
  skipSuccessfulRequests: true,
});

export const walletRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  message: { error: "TOO_MANY_REQUESTS", message: "Wallet rate limit exceeded" },
});

export const loanRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  message: { error: "TOO_MANY_REQUESTS", message: "Loan rate limit exceeded" },
});

export const sensitiveRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  message: { error: "TOO_MANY_REQUESTS", message: "Sensitive operation rate limit exceeded" },
});

export const apiRateLimiter: RateLimitRequestHandler = createRateLimiter({
  windowMs: 60_000,
  max: 200,
  message: { error: "TOO_MANY_REQUESTS", message: "API rate limit exceeded" },
});

export { rateLimit };
