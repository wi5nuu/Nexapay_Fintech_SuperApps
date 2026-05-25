import { v4 as uuidv4 } from "uuid";

export interface AuditLogInput {
  actorId: string;
  actorType: ActorType;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, AuditChangeValue> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  severity?: AuditSeverity;
}

export interface AuditChangeValue {
  from: unknown;
  to: unknown;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorType: ActorType;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, AuditChangeValue> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  severity: AuditSeverity;
  timestamp: string;
}

export type ActorType = "USER" | "SYSTEM" | "ADMIN" | "SUPPORT" | "COMPLIANCE" | "SERVICE" | "CRON";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type AuditAction =
  | "USER.CREATED"
  | "USER.LOGGED_IN"
  | "USER.LOGGED_OUT"
  | "USER.PASSWORD_CHANGED"
  | "USER.PROFILE_UPDATED"
  | "USER.ROLE_CHANGED"
  | "USER.DEACTIVATED"
  | "USER.ACTIVATED"
  | "USER.DELETED"
  | "KYC.SUBMITTED"
  | "KYC.VERIFIED"
  | "KYC.REJECTED"
  | "KYC.EXPIRED"
  | "WALLET.CREATED"
  | "WALLET.CREDITED"
  | "WALLET.DEBITED"
  | "WALLET.FROZEN"
  | "WALLET.UNFROZEN"
  | "TRANSFER.INITIATED"
  | "TRANSFER.COMPLETED"
  | "TRANSFER.FAILED"
  | "TRANSFER.REVERSED"
  | "LOAN.APPLIED"
  | "LOAN.APPROVED"
  | "LOAN.REJECTED"
  | "LOAN.DISBURSED"
  | "LOAN.REPAID"
  | "LOAN.DEFAULTED"
  | "LOAN.WRITTEN_OFF"
  | "LOAN.RESTRUCTURED"
  | "INVESTMENT.PURCHASED"
  | "INVESTMENT.WITHDRAWN"
  | "INVESTMENT.MATURED"
  | "FRAUD.ALERT_CREATED"
  | "FRAUD.ALERT_RESOLVED"
  | "NOTIFICATION.SENT"
  | "REPORT.GENERATED"
  | "SETTINGS.UPDATED"
  | "PERMISSION.CHANGED";

const DEFAULT_SEVERITY: AuditSeverity = "INFO";

const ACTION_SEVERITY_MAP: Partial<Record<AuditAction, AuditSeverity>> = {
  "USER.DEACTIVATED": "WARNING",
  "USER.DELETED": "CRITICAL",
  "TRANSFER.FAILED": "WARNING",
  "LOAN.DEFAULTED": "ERROR",
  "LOAN.WRITTEN_OFF": "ERROR",
  "FRAUD.ALERT_CREATED": "CRITICAL",
  "PERMISSION.CHANGED": "WARNING",
};

export const createAuditLogEntry = (input: AuditLogInput): AuditLogEntry => {
  const severity = input.severity ?? ACTION_SEVERITY_MAP[input.action as AuditAction] ?? DEFAULT_SEVERITY;

  return {
    id: uuidv4(),
    actorId: input.actorId,
    actorType: input.actorType,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    changes: input.changes ?? null,
    metadata: {
      ...input.metadata,
      _environment: process.env.NODE_ENV ?? "development",
      _service: process.env.SERVICE_NAME ?? "unknown",
    },
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    correlationId: input.correlationId ?? null,
    severity,
    timestamp: new Date().toISOString(),
  };
};

export const serializeAuditLogEntry = (entry: AuditLogEntry): string => {
  return JSON.stringify(entry);
};

export const deserializeAuditLogEntry = (json: string): AuditLogEntry => {
  return JSON.parse(json) as AuditLogEntry;
};

export const createSystemAuditEntry = (
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown> | null
): AuditLogEntry => {
  return createAuditLogEntry({
    actorId: "system",
    actorType: "SYSTEM",
    action,
    entityType,
    entityId,
    metadata,
  });
};

export const createAuditDiff = <T extends Record<string, unknown>>(
  before: T,
  after: T
): Record<string, AuditChangeValue> => {
  const changes: Record<string, AuditChangeValue> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const oldValue = before[key];
    const newValue = after[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { from: oldValue, to: newValue };
    }
  }

  return changes;
};
