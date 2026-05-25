import { v4 as uuidv4, validate as isUuid } from "uuid";
import { createHash, randomBytes } from "crypto";

export interface IdempotencyOptions {
  prefix?: string;
  separator?: string;
  hashAlgorithm?: string;
}

export interface IdempotencyValidationResult {
  valid: boolean;
  reason: string | null;
  normalizedKey: string | null;
}

const DEFAULT_OPTIONS: Required<IdempotencyOptions> = {
  prefix: "idem",
  separator: ":",
  hashAlgorithm: "sha256",
};

export const generateIdempotencyKey = (options?: IdempotencyOptions): string => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const uuid = uuidv4();
  return `${opts.prefix}${opts.separator}${uuid}`;
};

export const generateIdempotencyKeyFromPayload = (
  payload: Record<string, unknown>,
  options?: IdempotencyOptions
): string => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const serialized = JSON.stringify(payload, Object.keys(payload).sort());
  const hash = createHash(opts.hashAlgorithm).update(serialized).digest("hex");
  return `${opts.prefix}${opts.separator}${hash}`;
};

export const generateIdempotencyKeyForTransfer = (
  sourceWalletId: string,
  destinationWalletId: string,
  amount: number,
  currency: string
): string => {
  return generateIdempotencyKeyFromPayload({
    sourceWalletId,
    destinationWalletId,
    amount,
    currency,
    type: "transfer",
  });
};

export const generateIdempotencyKeyForPayment = (
  userId: string,
  amount: number,
  currency: string,
  destination: string
): string => {
  return generateIdempotencyKeyFromPayload({
    userId,
    amount,
    currency,
    destination,
    type: "payment",
  });
};

export const validateIdempotencyKey = (key: string, options?: IdempotencyOptions): IdempotencyValidationResult => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!key || typeof key !== "string") {
    return { valid: false, reason: "Idempotency key must be a non-empty string", normalizedKey: null };
  }

  if (key.length > 255) {
    return { valid: false, reason: "Idempotency key must not exceed 255 characters", normalizedKey: null };
  }

  const keyRegex = /^[a-zA-Z0-9:_\-]+$/;
  if (!keyRegex.test(key)) {
    return { valid: false, reason: "Idempotency key contains invalid characters", normalizedKey: null };
  }

  const normalizedKey = key.trim().toLowerCase();

  if (normalizedKey.startsWith(`${opts.prefix}${opts.separator}`)) {
    const uuidPart = normalizedKey.slice(opts.prefix.length + opts.separator.length);
    if (isUuid(uuidPart) || /^[a-f0-9]{64}$/.test(uuidPart)) {
      return { valid: true, reason: null, normalizedKey };
    }
    if (uuidPart.length === 0) {
      return { valid: false, reason: "Missing identifier after prefix", normalizedKey: null };
    }
    return { valid: true, reason: null, normalizedKey };
  }

  return { valid: true, reason: null, normalizedKey };
};

export const isExpiredIdempotencyKey = (createdAt: string | Date, ttlMs: number): boolean => {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const now = new Date();
  return now.getTime() - created.getTime() > ttlMs;
};

export const generateRetryIdempotencyKey = (originalKey: string, attempt: number): string => {
  const hash = createHash("sha256").update(`${originalKey}:attempt:${attempt}`).digest("hex");
  return `idem:retry:${hash}`;
};

export const generateSecureIdempotencyKey = (): string => {
  const random = randomBytes(32).toString("hex");
  const timestamp = Date.now().toString(36);
  return `idem:${timestamp}:${random}`;
};
