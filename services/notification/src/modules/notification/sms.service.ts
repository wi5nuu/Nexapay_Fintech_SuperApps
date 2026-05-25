import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { LoggerService } from '../../common/logger.service';

export interface SmsPayload {
  to: string;
  body: string;
}

@Injectable()
export class SmsService {
  private readonly client: Twilio | null = null;

  constructor(private readonly logger: LoggerService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials missing — SMS disabled', SmsService.name);
    }
  }

  async send(payload: SmsPayload): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('SMS not sent — Twilio not configured', SmsService.name);
      return false;
    }

    const from = process.env.TWILIO_FROM_NUMBER;
    if (!from) {
      this.logger.error('TWILIO_FROM_NUMBER not set', undefined, SmsService.name);
      return false;
    }

    try {
      await this.client.messages.create({ body: payload.body, from, to: payload.to });
      this.logger.log(`SMS sent to ${payload.to}`, SmsService.name);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMS error';
      this.logger.error(`Failed to send SMS to ${payload.to}: ${message}`, undefined, SmsService.name);
      return false;
    }
  }
}
