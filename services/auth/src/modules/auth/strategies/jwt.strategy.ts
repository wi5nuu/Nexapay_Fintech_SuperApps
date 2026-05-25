import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret-do-not-use',
      issuer: process.env.JWT_ISSUER ?? 'nexapay-auth',
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    role: string;
  }> {
    const user = await this.authRepository.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
