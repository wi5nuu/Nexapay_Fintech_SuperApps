import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { LoggerService } from '../../../common/logger.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';

jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
  }));
});

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    name: 'Test User',
    role: 'USER' as const,
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockRepository = {
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserRefreshTokens: jest.fn(),
    updateUserTwoFactorSecret: jest.fn(),
    updateUserTwoFactorEnabled: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
    verify: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get(AuthRepository);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'StrongP@ss1',
        name: 'New User',
      };

      mockRepository.findUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashed');
      mockRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.register(dto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(mockRepository.createUser).toHaveBeenCalledWith({
        email: dto.email,
        passwordHash: '$2b$12$hashed',
        name: dto.name,
      });
    });

    it('should throw ConflictException if email exists', async () => {
      mockRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'StrongP@ss1',
          name: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'StrongP@ss1' };

      mockRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(mockRepository.updateLastLogin).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA code when enabled', async () => {
      const userWith2fa = { ...mockUser, isTwoFactorEnabled: true };
      mockRepository.findUserByEmail.mockResolvedValue(userWith2fa);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'StrongP@ss1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockRefreshToken = {
        id: 'token-id',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
      };

      mockRepository.findRefreshToken.mockResolvedValue(mockRefreshToken);
      mockRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.refresh({ refreshToken: 'valid-refresh-token' });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(mockRepository.revokeRefreshToken).toHaveBeenCalled();
    });

    it('should throw for revoked token', async () => {
      const revokedToken = {
        id: 'token-id',
        token: 'revoked-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 10000),
        isRevoked: true,
        createdAt: new Date(),
      };

      mockRepository.findRefreshToken.mockResolvedValue(revokedToken);

      await expect(
        service.refresh({ refreshToken: 'revoked-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('2FA', () => {
    it('should enable 2FA and return secret + QR code', async () => {
      mockRepository.findUserById.mockResolvedValue(mockUser);
      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'MOCKBASE32SECRET',
        otpauth_url: 'otpauth://totp/NexaPay:test@example.com?secret=MOCK',
      });

      const result = await service.enableTwoFactor(mockUser.id);

      expect(result.secret).toBe('MOCKBASE32SECRET');
      expect(result.qrCode).toBeDefined();
    });

    it('should throw if 2FA already enabled', async () => {
      const userWith2fa = { ...mockUser, isTwoFactorEnabled: true };
      mockRepository.findUserById.mockResolvedValue(userWith2fa);

      await expect(
        service.enableTwoFactor(mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
