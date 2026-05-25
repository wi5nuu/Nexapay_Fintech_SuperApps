export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  kycStatus: KycLevel
  createdAt: string
  updatedAt: string
}

export type KycLevel = 'unverified' | 'pending' | 'verified' | 'rejected'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
  twoFactorCode?: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  twoFactorRequired?: boolean
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  accountNumber: string
  createdAt: string
  updatedAt: string
}

export type TransactionType = 'credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'top_up' | 'withdrawal'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed'

export interface Transaction {
  id: string
  walletId: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  reference: string
  counterparty?: string
  fee?: number
  createdAt: string
  updatedAt: string
}

export interface TopUpPayload {
  amount: number
  currency: string
  paymentMethod: string
}

export interface TransferPayload {
  recipientId: string
  amount: number
  currency: string
  description?: string
}

export interface KycSubmission {
  documentType: string
  documentNumber: string
  documentFile?: File
}

export interface KycStatusResponse {
  status: KycLevel
  level: string
  submittedAt?: string
  verifiedAt?: string
  rejectionReason?: string
}

export interface InvestmentProduct {
  id: string
  name: string
  description: string
  minInvestment: number
  maxInvestment: number
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  durationDays: number
  available: boolean
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
}
