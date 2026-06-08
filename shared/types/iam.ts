/**
 * Global Permission definitions for Role-Based Access Control (RBAC)
 */
export enum Permission {
  // User Management
  USERS_READ = 'users:read',
  USERS_WRITE = 'users:write',
  USERS_DELETE = 'users:delete',
  
  // KYC
  KYC_READ = 'kyc:read',
  KYC_APPROVE = 'kyc:approve',
  
  // Wallet & Transactions
  WALLET_READ = 'wallet:read',
  WALLET_DEBIT = 'wallet:debit',
  WALLET_CREDIT = 'wallet:credit',
  TRANSACTIONS_READ = 'transactions:read',
  
  // Loans
  LOANS_READ = 'loans:read',
  LOANS_APPLY = 'loans:apply',
  LOANS_APPROVE = 'loans:approve',
  
  // Investments
  INVESTMENTS_READ = 'investments:read',
  INVESTMENTS_WRITE = 'investments:write',
  
  // Admin & System
  ADMIN_ACCESS = 'admin:access',
  SYSTEM_SETTINGS = 'system:settings',
  AUDIT_READ = 'audit:read',
}

/**
 * Identity interface for an authenticated actor (User or Service)
 */
export interface IIdentity {
  id: string;
  type: 'USER' | 'SERVICE';
  roles: string[];
  permissions: Permission[];
  tenantId?: string;
}

/**
 * Subject interface for access control checks
 */
export interface IAuthSubject {
  identity: IIdentity;
  isAuthenticated: boolean;
}

/**
 * Access Control metadata for decorators
 */
export interface IAccessControlMetadata {
  permissions: Permission[];
  requireAll?: boolean;
}
