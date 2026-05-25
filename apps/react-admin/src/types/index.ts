export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'payment';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
export type ProductType = 'wallet' | 'card' | 'investment' | 'insurance' | 'savings';
export type ProductStatus = 'active' | 'inactive' | 'coming_soon' | 'discontinued';
export type RoleType = 'super_admin' | 'admin' | 'moderator' | 'support' | 'viewer';
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject' | 'suspend';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  kycStatus: KYCStatus;
  role: RoleType;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  reference: string;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  interestRate: number;
  termMonths: number;
  status: LoanStatus;
  purpose?: string;
  approvedBy?: string;
  approvedAt?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  description: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  actorName: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip: string;
  userAgent?: string;
  createdAt: string;
}

export interface RolePermission {
  role: RoleType;
  permissions: string[];
  description: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  pendingLoans: number;
  activeLoans: number;
  userGrowth: { date: string; count: number }[];
  revenueData: { date: string; amount: number }[];
  recentTransactions: Transaction[];
}
