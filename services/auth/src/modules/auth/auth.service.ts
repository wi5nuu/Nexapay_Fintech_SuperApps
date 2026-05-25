import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { UserEntity } from './entities/user.entity';
import { LoggerService } from '../../common/logger.service';
import Redis from 'ioredis';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly redis: Redis;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      keyPrefix: process.env.REDIS_PREFIX ?? 'auth:',
      lazyConnect: true,
    });
    this.redis.connect().catch((err: Error) => {
      this.logger.error('Failed to connect to Redis', err.stack);
    });
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.authRepository.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    this.logger.log(`User registered: ${user.email}`, { userId: user.id });

    return this.generateTokens(user);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isTwoFactorEnabled) {
      if (!dto.twoFactorCode) {
        throw new UnauthorizedException('Two-factor authentication code required');
      }

      const isValid = this.verifyTotp(user.twoFactorSecret ?? '', dto.twoFactorCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    await this.authRepository.updateLastLogin(user.id);

    this.logger.log(`User logged in: ${user.email}`, { userId: user.id });

    return this.generateTokens(user);
  }

  async refresh(
    dto: RefreshDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this.authRepository.findRefreshToken(
      dto.refreshToken,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    await this.authRepository.revokeRefreshToken(storedToken.token);

    const user = await this.authRepository.findUserById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    this.logger.log(`Token refreshed for user: ${user.email}`, {
      userId: user.id,
    });

    return this.generateTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.authRepository.revokeRefreshToken(refreshToken);
    await this.redis.del(`session:${userId}`);

    this.logger.log(`User logged out: ${userId}`);
  }

  async enableTwoFactor(
    userId: string,
  ): Promise<{ secret: string; qrCode: string }> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `NexaPay:${user.email}`,
      length: 32,
    });

    await this.authRepository.updateUserTwoFactorSecret(
      userId,
      secret.base32,
    );

    const qrCode = await QRCode.toDataURL(secret.otpauth_url ?? '');

    this.logger.log(`2FA enabled for user: ${user.email}`, { userId });

    return { secret: secret.base32, qrCode };
  }

  async verifyTwoFactor(
    userId: string,
    dto: VerifyTwoFactorDto,
  ): Promise<{ message: string }> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'Two-factor authentication has not been set up',
      );
    }

    const isValid = this.verifyTotp(user.twoFactorSecret, dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid two-factor authentication code');
    }

    await this.authRepository.updateUserTwoFactorEnabled(userId, true);

    this.logger.log(`2FA verified for user: ${user.email}`, { userId });

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async disableTwoFactor(
    userId: string,
    dto: VerifyTwoFactorDto,
  ): Promise<{ message: string }> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException(
        'Two-factor authentication is not enabled',
      );
    }

    const isValid = this.verifyTotp(user.twoFactorSecret ?? '', dto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid two-factor authentication code');
    }

    await this.authRepository.updateUserTwoFactorEnabled(userId, false);
    await this.authRepository.updateUserTwoFactorSecret(userId, null);

    this.logger.log(`2FA disabled for user: ${user.email}`, { userId });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  async getMe(userId: string): Promise<UserEntity> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return new UserEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async verifyToken(
    token: string,
  ): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
    role?: string;
    expiresAt?: number;
  }> {
    try {
      const payload = this.jwtService.verify(token);
      return {
        valid: true,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        expiresAt: payload.exp,
      };
    } catch {
      return { valid: false };
    }
  }

  async getUserForGrpc(
    userId: string,
  ): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    isTwoFactorEnabled: boolean;
    createdAt: number;
  } | null> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      createdAt: user.createdAt.getTime(),
    };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
      issuer: process.env.JWT_ISSUER ?? 'nexapay-auth',
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await this.authRepository.createRefreshToken({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt,
    });

    await this.redis.setex(
      `session:${user.id}`,
      refreshExpiresInDays * 24 * 60 * 60,
      accessToken,
    );

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private verifyTotp(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }
}
