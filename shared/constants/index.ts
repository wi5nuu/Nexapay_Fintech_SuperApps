/**
 * NexaPay Shared Constants
 *
 * API_PREFIXES  — Service route prefixes exposed through the Kong gateway.
 * CACHE_TTL     — Default TTL values for Redis cache entries in seconds.
 * KAFKA_TOPICS  — Enum of all Kafka topic names used across the platform.
 * EVENT_NAMES   — Canonical event name strings published to Kafka.
 * ERROR_CODES   — Standardized error codes returned in ApiResponse.error.code.
 * REDIS_KEY_PATTERNS — Documented Redis key patterns for caching and rate limiting.
 */

// ─────────────────────────
// API Route Prefixes
// ─────────────────────────
export const API_PREFIXES = {
  AUTH: "/api/v1/auth",
  USERS: "/api/v1/users",
  WALLETS: "/api/v1/wallets",
  LOANS: "/api/v1/loans",
  INVESTMENTS: "/api/v1/investments",
  NOTIFICATIONS: "/api/v1/notifications",
  REPORTS: "/api/v1/reports",
  FRAUD: "/api/v1/fraud",
  GRAPHQL: "/graphql",
} as const;

export type ApiPrefix = (typeof API_PREFIXES)[keyof typeof API_PREFIXES];

// ─────────────────────────
// Cache TTL (seconds)
// ─────────────────────────
export const CACHE_TTL = {
  USER_PROFILE: 300,
  WALLET_BALANCE: 60,
  TRANSACTION_LIST: 120,
  LOAN_DETAILS: 180,
  INVESTMENT_DETAILS: 180,
  EXCHANGE_RATES: 120,
  KYC_STATUS: 300,
  NOTIFICATION_LIST: 60,
  REPORT_CACHE: 600,
  PUBLIC_CONFIG: 900,
  RATE_LIMIT_WINDOW: 60,
  SESSION_BLACKLIST: 3600,
} as const;

export type CacheKey = keyof typeof CACHE_TTL;

// ─────────────────────────
// Kafka Topics
// ─────────────────────────
export enum KAFKA_TOPICS {
  WALLET_CREDITED = "nexapay.wallet.credited",
  WALLET_DEBITED = "nexapay.wallet.debited",
  TRANSFER_COMPLETED = "nexapay.transfer.completed",
  TRANSFER_FAILED = "nexapay.transfer.failed",
  LOAN_DISBURSED = "nexapay.loan.disbursed",
  LOAN_REPAID = "nexapay.loan.repaid",
  LOAN_DEFAULTED = "nexapay.loan.defaulted",
  LOAN_APPROVED = "nexapay.loan.approved",
  KYC_VERIFIED = "nexapay.kyc.verified",
  KYC_REJECTED = "nexapay.kyc.rejected",
  KYC_SUBMITTED = "nexapay.kyc.submitted",
  FRAUD_ALERT = "nexapay.fraud.alert",
  FRAUD_RESOLVED = "nexapay.fraud.resolved",
  INVESTMENT_PURCHASED = "nexapay.investment.purchased",
  INVESTMENT_WITHDRAWN = "nexapay.investment.withdrawn",
  INVESTMENT_MATURED = "nexapay.investment.matured",
  USER_REGISTERED = "nexapay.user.registered",
  USER_LOGGED_IN = "nexapay.user.logged_in",
  NOTIFICATION_SENT = "nexapay.notification.sent",
  CDC_PREFIX = "nexapay.cdc.",
  DEAD_LETTER_QUEUE = "nexapay.cdc.dlq",
}

// ─────────────────────────
// Event Names
// ─────────────────────────
export const EVENT_NAMES = {
  WALLET_CREDITED: "wallet.credited",
  WALLET_DEBITED: "wallet.debited",
  TRANSFER_COMPLETED: "transfer.completed",
  TRANSFER_FAILED: "transfer.failed",
  LOAN_DISBURSED: "loan.disbursed",
  LOAN_REPAID: "loan.repaid",
  LOAN_DEFAULTED: "loan.defaulted",
  LOAN_APPROVED: "loan.approved",
  KYC_VERIFIED: "kyc.verified",
  KYC_REJECTED: "kyc.rejected",
  KYC_SUBMITTED: "kyc.submitted",
  FRAUD_ALERT: "fraud.alert",
  FRAUD_RESOLVED: "fraud.resolved",
  INVESTMENT_PURCHASED: "investment.purchased",
  INVESTMENT_WITHDRAWN: "investment.withdrawn",
  INVESTMENT_MATURED: "investment.matured",
  USER_REGISTERED: "user.registered",
  USER_LOGGED_IN: "user.logged_in",
  NOTIFICATION_SENT: "notification.sent",
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

export const EVENT_NAME_TO_TOPIC: Record<EventName, KAFKA_TOPICS> = {
  [EVENT_NAMES.WALLET_CREDITED]: KAFKA_TOPICS.WALLET_CREDITED,
  [EVENT_NAMES.WALLET_DEBITED]: KAFKA_TOPICS.WALLET_DEBITED,
  [EVENT_NAMES.TRANSFER_COMPLETED]: KAFKA_TOPICS.TRANSFER_COMPLETED,
  [EVENT_NAMES.TRANSFER_FAILED]: KAFKA_TOPICS.TRANSFER_FAILED,
  [EVENT_NAMES.LOAN_DISBURSED]: KAFKA_TOPICS.LOAN_DISBURSED,
  [EVENT_NAMES.LOAN_REPAID]: KAFKA_TOPICS.LOAN_REPAID,
  [EVENT_NAMES.LOAN_DEFAULTED]: KAFKA_TOPICS.LOAN_DEFAULTED,
  [EVENT_NAMES.LOAN_APPROVED]: KAFKA_TOPICS.LOAN_APPROVED,
  [EVENT_NAMES.KYC_VERIFIED]: KAFKA_TOPICS.KYC_VERIFIED,
  [EVENT_NAMES.KYC_REJECTED]: KAFKA_TOPICS.KYC_REJECTED,
  [EVENT_NAMES.KYC_SUBMITTED]: KAFKA_TOPICS.KYC_SUBMITTED,
  [EVENT_NAMES.FRAUD_ALERT]: KAFKA_TOPICS.FRAUD_ALERT,
  [EVENT_NAMES.FRAUD_RESOLVED]: KAFKA_TOPICS.FRAUD_RESOLVED,
  [EVENT_NAMES.INVESTMENT_PURCHASED]: KAFKA_TOPICS.INVESTMENT_PURCHASED,
  [EVENT_NAMES.INVESTMENT_WITHDRAWN]: KAFKA_TOPICS.INVESTMENT_WITHDRAWN,
  [EVENT_NAMES.INVESTMENT_MATURED]: KAFKA_TOPICS.INVESTMENT_MATURED,
  [EVENT_NAMES.USER_REGISTERED]: KAFKA_TOPICS.USER_REGISTERED,
  [EVENT_NAMES.USER_LOGGED_IN]: KAFKA_TOPICS.USER_LOGGED_IN,
  [EVENT_NAMES.NOTIFICATION_SENT]: KAFKA_TOPICS.NOTIFICATION_SENT,
};

// ─────────────────────────
// Error Codes
// ─────────────────────────
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_INVALID: "MFA_INVALID",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_FIELD: "MISSING_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  INVALID_CURRENCY: "INVALID_CURRENCY",
  UNSUPPORTED_OPERATION: "UNSUPPORTED_OPERATION",

  // Wallet
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  WALLET_NOT_FOUND: "WALLET_NOT_FOUND",
  WALLET_FROZEN: "WALLET_FROZEN",
  WALLET_LIMIT_EXCEEDED: "WALLET_LIMIT_EXCEEDED",
  DUPLICATE_TRANSACTION: "DUPLICATE_TRANSACTION",
  TRANSACTION_NOT_FOUND: "TRANSACTION_NOT_FOUND",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",

  // Loan
  LOAN_NOT_FOUND: "LOAN_NOT_FOUND",
  LOAN_NOT_ELIGIBLE: "LOAN_NOT_ELIGIBLE",
  LOAN_LIMIT_EXCEEDED: "LOAN_LIMIT_EXCEEDED",
  LOAN_ALREADY_DISBURSED: "LOAN_ALREADY_DISBURSED",
  LOAN_NOT_DUE: "LOAN_NOT_DUE",
  LOAN_IN_DEFAULT: "LOAN_IN_DEFAULT",

  // KYC
  KYC_NOT_FOUND: "KYC_NOT_FOUND",
  KYC_ALREADY_VERIFIED: "KYC_ALREADY_VERIFIED",
  KYC_REJECTED: "KYC_REJECTED",
  KYC_PENDING: "KYC_PENDING",
  KYC_EXPIRED: "KYC_EXPIRED",
  KYC_LIMIT_REACHED: "KYC_LIMIT_REACHED",

  // Investment
  INVESTMENT_NOT_FOUND: "INVESTMENT_NOT_FOUND",
  INVESTMENT_NOT_MATURED: "INVESTMENT_NOT_MATURED",
  INVESTMENT_MINIMUM_NOT_MET: "INVESTMENT_MINIMUM_NOT_MET",
  INVESTMENT_MAXIMUM_EXCEEDED: "INVESTMENT_MAXIMUM_EXCEEDED",

  // Fraud
  FRAUD_SUSPECTED: "FRAUD_SUSPECTED",
  TRANSACTION_BLOCKED: "TRANSACTION_BLOCKED",

  // Rate Limiting
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Idempotency
  IDEMPOTENCY_KEY_MISSING: "IDEMPOTENCY_KEY_MISSING",
  IDEMPOTENCY_KEY_EXPIRED: "IDEMPOTENCY_KEY_EXPIRED",
  IDEMPOTENCY_MISMATCH: "IDEMPOTENCY_MISMATCH",

  // General
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  BAD_GATEWAY: "BAD_GATEWAY",
  GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─────────────────────────
// Redis Key Patterns
// ─────────────────────────
//
// All Redis keys follow the pattern:
//   nexapay:<domain>:<entity>:<identifier>[:<suffix>]
//
// ─── User / Auth ───
//   nexapay:user:profile:{userId}            — User profile cache (TTL: CACHE_TTL.USER_PROFILE)
//   nexapay:user:session:{sessionId}         — Active session data
//   nexapay:user:sessions:{userId}           — Set of active session IDs for a user
//   nexapay:user:blacklist:{jti}             — Blacklisted JWT token (TTL: up to token expiry)
//   nexapay:user:otp:{identifier}            — OTP code for phone/email verification
//   nexapay:user:login:attempts:{identifier} — Failed login attempt counter
//   nexapay:user:lockout:{identifier}        — Account lockout flag
//
// ─── Wallet ───
//   nexapay:wallet:balance:{walletId}        — Cached wallet balance (TTL: CACHE_TTL.WALLET_BALANCE)
//   nexapay:wallet:transactions:{walletId}   — Recent transaction list cache (TTL: CACHE_TTL.TRANSACTION_LIST)
//   nexapay:wallet:lock:{walletId}           — Distributed lock for wallet operations
//
// ─── Transaction ───
//   nexapay:idempotency:{key}                — Idempotency record for a given key (TTL: 24h)
//   nexapay:transaction:{reference}          — Transaction lookup by reference
//
// ─── Loan ───
//   nexapay:loan:detail:{loanId}             — Loan application cache (TTL: CACHE_TTL.LOAN_DETAILS)
//   nexapay:loan:user:{userId}               — User's active loan list cache
//   nexapay:loan:credit-score:{userId}       — Cached credit score (TTL: 3600s)
//
// ─── Investment ───
//   nexapay:investment:detail:{investmentId} — Investment product cache (TTL: CACHE_TTL.INVESTMENT_DETAILS)
//   nexapay:investment:user:{userId}         — User's investment list cache
//
// ─── KYC ───
//   nexapay:kyc:status:{userId}              — KYC status cache (TTL: CACHE_TTL.KYC_STATUS)
//   nexapay:kyc:document:{documentId}        — Individual document cache
//
// ─── Rate Limiting ───
//   nexapay:ratelimit:{key}:{window}         — Rate limit counter (TTL: window duration)
//   nexapay:ratelimit:auth:{ip}              — Auth endpoint rate limit
//   nexapay:ratelimit:wallet:{userId}        — Wallet operation rate limit
//
// ─── Notifications ───
//   nexapay:notification:user:{userId}       — User's notification list cache (TTL: CACHE_TTL.NOTIFICATION_LIST)
//
// ─── Reporting ───
//   nexapay:report:{reportId}                — Generated report cache (TTL: CACHE_TTL.REPORT_CACHE)
//
// ─── Distributed Locks ───
//   nexapay:lock:{resource}                  — Redlock distributed lock for critical sections
//
// ─── CDC / Kafka Offsets ───
//   nexapay:cdc:offset:{connector}           — CDC offset tracking for resume support
//
// ─────────────────────────

export const REDIS_KEY_PATTERNS = {
  USER_PROFILE: "nexapay:user:profile:{userId}",
  USER_SESSION: "nexapay:user:session:{sessionId}",
  USER_SESSIONS_SET: "nexapay:user:sessions:{userId}",
  USER_BLACKLIST: "nexapay:user:blacklist:{jti}",
  USER_OTP: "nexapay:user:otp:{identifier}",
  USER_LOGIN_ATTEMPTS: "nexapay:user:login:attempts:{identifier}",
  USER_LOCKOUT: "nexapay:user:lockout:{identifier}",
  WALLET_BALANCE: "nexapay:wallet:balance:{walletId}",
  WALLET_TRANSACTIONS: "nexapay:wallet:transactions:{walletId}",
  WALLET_LOCK: "nexapay:wallet:lock:{walletId}",
  IDEMPOTENCY: "nexapay:idempotency:{key}",
  TRANSACTION_REFERENCE: "nexapay:transaction:{reference}",
  LOAN_DETAIL: "nexapay:loan:detail:{loanId}",
  LOAN_USER_LIST: "nexapay:loan:user:{userId}",
  CREDIT_SCORE: "nexapay:loan:credit-score:{userId}",
  INVESTMENT_DETAIL: "nexapay:investment:detail:{investmentId}",
  INVESTMENT_USER_LIST: "nexapay:investment:user:{userId}",
  KYC_STATUS: "nexapay:kyc:status:{userId}",
  KYC_DOCUMENT: "nexapay:kyc:document:{documentId}",
  RATE_LIMIT: "nexapay:ratelimit:{key}:{window}",
  RATE_LIMIT_AUTH: "nexapay:ratelimit:auth:{ip}",
  RATE_LIMIT_WALLET: "nexapay:ratelimit:wallet:{userId}",
  NOTIFICATION_USER_LIST: "nexapay:notification:user:{userId}",
  REPORT_CACHE: "nexapay:report:{reportId}",
  DISTRIBUTED_LOCK: "nexapay:lock:{resource}",
  CDC_OFFSET: "nexapay:cdc:offset:{connector}",
} as const;

export const REDIS_KEY_TEMPLATE = (pattern: string, params: Record<string, string>): string => {
  let key = pattern;
  for (const [param, value] of Object.entries(params)) {
    key = key.replace(`{${param}}`, value);
  }
  return key;
};
