import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LoggerService } from '../../common/logger.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'fallback-secret-do-not-use',
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
        issuer: process.env.JWT_ISSUER ?? 'nexapay-auth',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
    GoogleStrategy,
    LoggerService,
  ],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
