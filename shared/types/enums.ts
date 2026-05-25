export enum UserRole {
  CUSTOMER = "CUSTOMER",
  MERCHANT = "MERCHANT",
  ADMIN = "ADMIN",
  SUPPORT = "SUPPORT",
  COMPLIANCE = "COMPLIANCE",
}

export enum KycStatus {
  UNVERIFIED = "UNVERIFIED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum TransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
  TRANSFER = "TRANSFER",
  WITHDRAWAL = "WITHDRAWAL",
  DEPOSIT = "DEPOSIT",
  REFUND = "REFUND",
  FEE = "FEE",
  REVERSAL = "REVERSAL",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
  CANCELLED = "CANCELLED",
}

export enum LoanStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED",
  ACTIVE = "ACTIVE",
  REPAID = "REPAID",
  DEFAULTED = "DEFAULTED",
  WRITTEN_OFF = "WRITTEN_OFF",
}

export enum InvestmentType {
  FIXED_DEPOSIT = "FIXED_DEPOSIT",
  MUTUAL_FUND = "MUTUAL_FUND",
  TREASURY_BILL = "TREASURY_BILL",
  BOND = "BOND",
  STOCK = "STOCK",
  REAL_ESTATE = "REAL_ESTATE",
}

export enum RiskLevel {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

export enum InvestmentStatus {
  ACTIVE = "ACTIVE",
  MATURED = "MATURED",
  WITHDRAWN = "WITHDRAWN",
  CANCELLED = "CANCELLED",
}

export enum NotificationChannel {
  PUSH = "PUSH",
  SMS = "SMS",
  EMAIL = "EMAIL",
  IN_APP = "IN_APP",
  WEBHOOK = "WEBHOOK",
}

export enum ReportGranularity {
  HOURLY = "HOURLY",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum FraudSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum FraudAlertStatus {
  OPEN = "OPEN",
  INVESTIGATING = "INVESTIGATING",
  CONFIRMED = "CONFIRMED",
  FALSE_POSITIVE = "FALSE_POSITIVE",
  RESOLVED = "RESOLVED",
}

export enum EventStatus {
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
  CONSUMED = "CONSUMED",
}

export enum Currency {
  USD = "USD",
  EUR = "EUR",
  GBP = "GBP",
  NGN = "NGN",
  KES = "KES",
  ZAR = "ZAR",
  GHS = "GHS",
  XOF = "XOF",
}
