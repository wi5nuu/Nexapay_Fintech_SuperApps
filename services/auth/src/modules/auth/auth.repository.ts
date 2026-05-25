import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, User, RefreshToken, Role } from '@prisma/client';

@Injectable()
export class AuthRepository extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<User> {
    return this.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: Role.USER,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.user.findUnique({
      where: { id },
    });
  }

  async createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return this.refreshToken.findUnique({
      where: { token },
    });
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async updateUserTwoFactorSecret(
    userId: string,
    secret: string | null,
  ): Promise<void> {
    await this.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });
  }

  async updateUserTwoFactorEnabled(
    userId: string,
    enabled: boolean,
  ): Promise<void> {
    await this.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: enabled },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
