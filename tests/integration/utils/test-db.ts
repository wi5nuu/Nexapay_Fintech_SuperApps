import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface TestWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TestTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'topup' | 'transfer' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  reference: string;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

async function getPool(dbName: 'auth' | 'users' | 'wallets' | 'loans'): Promise<Pool> {
  const { getConnections } = await import('../test-setup');
  const conn = getConnections();
  return conn.postgres.get(dbName)!;
}

async function createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
  const pool = await getPool('auth');
  const id = uuidv4();
  const now = new Date();

  const defaults: TestUser = {
    id,
    email: `test_${id.slice(0, 8)}@nexapay.dev`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: `User_${id.slice(0, 6)}`,
    phone: `+1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
    isVerified: false,
    isTwoFactorEnabled: false,
    kycStatus: 'not_started',
    role: 'user',
    createdAt: now,
    updatedAt: now,
  };

  const user = { ...defaults, ...overrides };
  const hashedPassword = await bcrypt.hash(user.password, 10);

  await pool.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, phone,
       is_verified, is_two_factor_enabled, kyc_status, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      user.id, user.email, hashedPassword, user.firstName, user.lastName,
      user.phone, user.isVerified, user.isTwoFactorEnabled, user.kycStatus,
      user.role, user.createdAt, user.updatedAt,
    ],
  );

  return user;
}

async function createTestWallet(overrides: Partial<TestWallet> = {}): Promise<TestWallet> {
  const pool = await getPool('wallets');
  const id = uuidv4();
  const now = new Date();

  const defaults: TestWallet = {
    id,
    userId: overrides.userId || uuidv4(),
    balance: 1000.00,
    currency: 'USD',
    status: 'active',
    dailyLimit: 10000,
    monthlyLimit: 50000,
    createdAt: now,
    updatedAt: now,
  };

  const wallet = { ...defaults, ...overrides };

  await pool.query(
    `INSERT INTO wallets (id, user_id, balance, currency, status, daily_limit,
       monthly_limit, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      wallet.id, wallet.userId, wallet.balance, wallet.currency,
      wallet.status, wallet.dailyLimit, wallet.monthlyLimit,
      wallet.createdAt, wallet.updatedAt,
    ],
  );

  return wallet;
}

async function createTestTransaction(
  overrides: Partial<TestTransaction> = {},
): Promise<TestTransaction> {
  const pool = await getPool('wallets');
  const id = uuidv4();
  const now = new Date();

  const defaults: TestTransaction = {
    id,
    walletId: overrides.walletId || uuidv4(),
    userId: overrides.userId || uuidv4(),
    type: 'topup',
    amount: 100.00,
    currency: 'USD',
    status: 'completed',
    reference: `TXN-${Date.now()}-${id.slice(0, 8)}`,
    idempotencyKey: uuidv4(),
    metadata: { source: 'test', description: 'Test transaction' },
    createdAt: now,
  };

  const tx = { ...defaults, ...overrides };

  await pool.query(
    `INSERT INTO transactions (id, wallet_id, user_id, type, amount, currency,
       status, reference, idempotency_key, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      tx.id, tx.walletId, tx.userId, tx.type, tx.amount, tx.currency,
      tx.status, tx.reference, tx.idempotencyKey,
      JSON.stringify(tx.metadata), tx.createdAt,
    ],
  );

  return tx;
}

async function cleanupTestData(): Promise<void> {
  const databases = ['auth', 'users', 'wallets', 'loans'];
  for (const db of databases) {
    const pool = await getPool(db as 'auth' | 'users' | 'wallets' | 'loans');
    const tables = await getTableNames(pool);
    for (const table of tables) {
      await pool.query(`DELETE FROM ${table}`);
    }
  }
}

async function getTableNames(pool: Pool): Promise<string[]> {
  const result = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  return result.rows.map((r) => r.tablename);
}

async function verifyBalance(pool: Pool, walletId: string): Promise<number> {
  const result = await pool.query(
    'SELECT balance FROM wallets WHERE id = $1',
    [walletId],
  );
  return result.rows[0]?.balance || 0;
}

async function verifyIdempotency(pool: Pool, key: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT id FROM transactions WHERE idempotency_key = $1',
    [key],
  );
  return result.rows.length > 0;
}

export {
  TestUser,
  TestWallet,
  TestTransaction,
  createTestUser,
  createTestWallet,
  createTestTransaction,
  cleanupTestData,
  verifyBalance,
  verifyIdempotency,
};
