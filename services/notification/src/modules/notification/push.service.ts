import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { LoggerService } from '../../common/logger.service';

export interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService implements OnModuleInit {
  private initialized = false;

  constructor(private readonly logger: LoggerService) {}

  onModuleInit(): void {
    if (process.env.FCM_PROJECT_ID) {
      const privateKey = (process.env.FCM_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          type: process.env.FCM_TYPE ?? 'service_account',
          projectId: process.env.FCM_PROJECT_ID,
          privateKeyId: process.env.FCM_PRIVATE_KEY_ID,
          privateKey,
          clientEmail: process.env.FCM_CLIENT_EMAIL,
          clientId: process.env.FCM_CLIENT_ID,
          authUri: process.env.FCM_AUTH_URI,
          tokenUri: process.env.FCM_TOKEN_URI,
          authProviderX509CertUrl: process.env.FCM_AUTH_PROVIDER_X509_CERT_URL,
          clientX509CertUrl: process.env.FCM_CLIENT_X509_CERT_URL,
        }),
      });
      this.initialized = true;
      this.logger.log('Firebase Cloud Messaging initialized', PushService.name);
    } else {
      this.logger.warn('FCM credentials missing — push notifications disabled', PushService.name);
    }
  }

  async send(payload: PushPayload): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Push not sent — FCM not initialized', PushService.name);
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: payload.token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      };
      await admin.messaging().send(message);
      this.logger.log(`Push sent to token ${payload.token.slice(0, 12)}...`, PushService.name);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown FCM error';
      this.logger.error(`Failed to send push: ${message}`, undefined, PushService.name);
      return false;
    }
  }
}
