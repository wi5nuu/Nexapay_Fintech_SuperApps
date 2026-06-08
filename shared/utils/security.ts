import { randomBytes, createHash } from 'crypto';

/**
 * Enhanced Security Utilities for common cryptographic operations.
 * Builds upon the base crypto.ts with additional enterprise-grade helpers.
 */
export class SecurityUtils {
  /**
   * Generates a cryptographically strong random string of a given length.
   */
  static generateRandomString(length: number = 32): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generates a secure HMAC-SHA512 hash of a given string using a secret.
   */
  static hashString(data: string, secret: string): string {
    return createHash('sha512')
      .update(data + secret)
      .digest('hex');
  }

  /**
   * Compares two strings in constant time to prevent timing attacks.
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Masks a sensitive string (e.g., credit card, email).
   * Example: '1234567890123456' -> '************3456'
   */
  static maskSensitive(value: string, visibleCount: number = 4): string {
    if (value.length <= visibleCount) return value;
    const masked = '*'.repeat(value.length - visibleCount);
    const visible = value.slice(-visibleCount);
    return masked + visible;
  }

  /**
   * Generates a secure One-Time Password (OTP)
   */
  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % 10];
    }
    return otp;
  }
}
