import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

interface TokenPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  permissions: string[];
  iat?: number;
  exp?: number;
  iss?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const TEST_ACCESS_SECRET = 'test-access-secret-at-least-32-characters-long';
const TEST_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters-long';
const TEST_ISSUER = 'nexapay-auth-test';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const PERMISSION_MAP: Record<string, string[]> = {
  user: [
    'profile:read', 'profile:write',
    'wallet:read', 'wallet:write',
    'transaction:read', 'transaction:write',
    'kyc:read', 'kyc:write',
    'loan:read', 'loan:write',
    'notification:read',
  ],
  admin: [
    'profile:read', 'profile:write',
    'wallet:read', 'wallet:write',
    'transaction:read', 'transaction:write',
    'kyc:read', 'kyc:write',
    'kyc:approve',
    'loan:read', 'loan:write',
    'notification:read', 'notification:write',
    'admin:read', 'admin:write',
    'audit:read',
    'users:read', 'users:write',
  ],
};

function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}): string {
  const tokenPayload: TokenPayload = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: PERMISSION_MAP[payload.role] || PERMISSION_MAP.user,
    iss: TEST_ISSUER,
  };

  return jwt.sign(tokenPayload, TEST_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh', jti: crypto.randomUUID() },
    TEST_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY, issuer: TEST_ISSUER, algorithm: 'HS256' },
  );
}

function generateTokenPair(user: {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}): TokenPair {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.userId),
  };
}

function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, TEST_ACCESS_SECRET, {
    issuer: TEST_ISSUER,
    algorithms: ['HS256'],
  }) as TokenPayload;
}

function verifyRefreshToken(token: string): { sub: string; jti: string } {
  return jwt.verify(token, TEST_REFRESH_SECRET, {
    issuer: TEST_ISSUER,
    algorithms: ['HS256'],
  }) as { sub: string; jti: string };
}

function generateExpiredToken(userId: string, email: string, role: 'user' | 'admin'): string {
  const tokenPayload: TokenPayload = {
    sub: userId,
    email,
    role,
    permissions: PERMISSION_MAP[role] || PERMISSION_MAP.user,
    iss: TEST_ISSUER,
    iat: Math.floor(Date.now() / 1000) - 3600,
    exp: Math.floor(Date.now() / 1000) - 60,
  };

  return jwt.sign(tokenPayload, TEST_ACCESS_SECRET, { algorithm: 'HS256' });
}

function generateTokenWithCustomClaims(
  payload: Partial<TokenPayload> & { userId: string; email: string; role: 'user' | 'admin' },
): string {
  const tokenPayload: TokenPayload = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions || PERMISSION_MAP[payload.role] || PERMISSION_MAP.user,
    iss: payload.iss || TEST_ISSUER,
    iat: payload.iat || Math.floor(Date.now() / 1000),
    exp: payload.exp || Math.floor(Date.now() / 1000) + 900,
  };

  return jwt.sign(tokenPayload, TEST_ACCESS_SECRET, { algorithm: 'HS256' });
}

function generateTamperedToken(validToken: string): string {
  const parts = validToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

  payload.email = 'hacked@evil.com';
  payload.role = 'admin';

  const tamperedPayload = Buffer.from(JSON.stringify(payload))
    .toString('base64url')
    .replace(/=+$/, '');

  return `${parts[0]}.${tamperedPayload}.${parts[2]}`;
}

function generateAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

function getTestSecrets(): { accessSecret: string; refreshSecret: string } {
  return { accessSecret: TEST_ACCESS_SECRET, refreshSecret: TEST_REFRESH_SECRET };
}

export {
  TokenPayload,
  TokenPair,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateExpiredToken,
  generateTokenWithCustomClaims,
  generateTamperedToken,
  generateAuthHeader,
  getTestSecrets,
};
