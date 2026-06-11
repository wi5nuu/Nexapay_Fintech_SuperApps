import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyTwoFactorDto } from './dto/verify-2fa.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(_dto: RegisterDto): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }> {
    throw new Error('Not implemented');
  }

  async login(_dto: LoginDto): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }> {
    throw new Error('Not implemented');
  }

  async refresh(_dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
    throw new Error('Not implemented');
  }

  async logout(_userId: string, _refreshToken: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async enableTwoFactor(_userId: string): Promise<{ secret: string; qrCode: string }> {
    throw new Error('Not implemented');
  }

  async verifyTwoFactor(_userId: string, _dto: VerifyTwoFactorDto): Promise<{ message: string }> {
    throw new Error('Not implemented');
  }

  async disableTwoFactor(_userId: string, _dto: VerifyTwoFactorDto): Promise<{ message: string }> {
    throw new Error('Not implemented');
  }

  async getMe(_userId: string): Promise<UserEntity> {
    throw new Error('Not implemented');
  }

  async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d', secret: process.env.REFRESH_SECRET }),
    };
  }
}
