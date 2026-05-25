import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class WalletThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const xff = req.headers?.['x-forwarded-for'] as string | undefined;
    const ip = xff?.split(',')[0]?.trim() ?? req.ip;
    return String(ip);
  }
}
