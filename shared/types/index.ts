import {
  UserRole,
  KycStatus,
  TransactionType,
  TransactionStatus,
  LoanStatus,
  InvestmentType,
  RiskLevel,
  InvestmentStatus,
  NotificationChannel,
  ReportGranularity,
  FraudSeverity,
  FraudAlertStatus,
} from "./enums";

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  kycStatus: KycStatus;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  locale: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: string;
  jti: string;
  sessionId: string;
}

export interface WalletBalance {
  walletId: string;
  userId: string;
  balance: number;
  currency: string;
  ledgerBalance: number;
  availableBalance: number;
  pendingBalance: number;
  isFrozen: boolean;
  frozenReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string | null;
  reference: string;
  idempotencyKey: string | null;
  metadata: Record<string, unknown> | null;
  fee: number | null;
  balanceBefore: number;
  balanceAfter: number;
  sourceWalletId: string | null;
  destinationWalletId: string | null;
  failureReason: string | null;
  failureCode: string | null;
  reversalReason: string | null;
  reversedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanApplication {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: string | null;
  termMonths: number;
  interestRate: number;
  status: LoanStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedReason: string | null;
  disbursedAt: string | null;
  repaidAmount: number | null;
  remainingBalance: number | null;
  dueDate: string | null;
  collateral: Record<string, unknown> | null;
  employmentDetails: Record<string, unknown> | null;
  creditScoreAtApplication: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface KycDocument {
  id: string;
  userId: string;
  type: KycDocumentType;
  status: KycStatus;
  fileUrl: string | null;
  country: string | null;
  idNumber: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectedReason: string | null;
  rejectionCode: string | null;
  confidenceScore: number | null;
  canReapply: boolean;
  createdAt: string;
  updatedAt: string;
}

export type KycDocumentType =
  | "PASSPORT"
  | "NATIONAL_ID"
  | "DRIVERS_LICENSE"
  | "UTILITY_BILL"
  | "BANK_STATEMENT"
  | "SELFIE";

export interface InvestmentProduct {
  id: string;
  userId: string;
  type: InvestmentType;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  expectedReturn: number;
  riskLevel: RiskLevel;
  status: InvestmentStatus;
  maturityDate: string | null;
  purchasedAt: string;
  withdrawnAt: string | null;
  earlyWithdrawalPenalty: number | null;
  autoReinvest: boolean;
  returns: InvestmentReturn[];
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentReturn {
  id: string;
  investmentId: string;
  amount: number;
  currency: string;
  type: ReturnType;
  paidAt: string;
  createdAt: string;
}

export type ReturnType = "INTEREST" | "DIVIDEND" | "CAPITAL_GAIN";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type NotificationType =
  | "TRANSACTION_ALERT"
  | "KYC_UPDATE"
  | "LOAN_UPDATE"
  | "INVESTMENT_UPDATE"
  | "PROMOTIONAL"
  | "SYSTEM_ALERT"
  | "FRAUD_ALERT"
  | "SECURITY_ALERT";

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, AuditChange> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  timestamp: string;
}

export interface AuditChange {
  from: unknown;
  to: unknown;
}

export interface FraudAlert {
  id: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  severity: FraudSeverity;
  status: FraudAlertStatus;
  description: string;
  riskScore: number;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  deviceFingerprint: string | null;
  transactionId: string | null;
  affectedEntityType: string | null;
  affectedEntityId: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
  requestId: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
  stackTrace: string | null;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface IdempotencyRecord {
  key: string;
  response: Record<string, unknown>;
  statusCode: number;
  expiresAt: string;
  createdAt: string;
}
