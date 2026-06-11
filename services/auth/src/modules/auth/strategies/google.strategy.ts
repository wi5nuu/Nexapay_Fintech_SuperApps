import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName: string;
      emails?: { value: string; verified: boolean }[];
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const { displayName, emails } = profile;
    const email = emails?.[0]?.value ?? '';
    const user = {
      email,
      name: displayName,
      accessToken,
    };
    done(null, user);
  }
}
