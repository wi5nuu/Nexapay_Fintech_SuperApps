import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/logger.service';
import { NotificationRepository } from './notification.repository';
import { EmailService, EmailPayload } from './email.service';
import { SmsService, SmsPayload } from './sms.service';
import { PushService, PushPayload } from './push.service';
import { NotificationGateway } from './notification.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferencesDto } from './dto/notification-preferences.dto';
import { NotificationDocument, NotificationChannel, NotificationPriority } from './schemas/notification.schema';
import { PreferenceDocument, ChannelPreferences, TopicPreferences } from './schemas/preference.schema';

interface IncomingNotification {
  userId: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  topic: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  emailAddress?: string;
  phoneNumber?: string;
  pushToken?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly gateway: NotificationGateway,
    private readonly logger: LoggerService,
  ) {}

  async processIncoming(data: IncomingNotification): Promise<void> {
    const prefs = await this.repository.getPreferences(data.userId);

    if (prefs?.doNotDisturb && data.priority !== 'critical') {
      this.logger.log(`DND active for user ${data.userId} — notification suppressed`, NotificationService.name);
      return;
    }

    const topic = this.mapTopic(data.topic);
    const topicPrefs: ChannelPreferences | undefined = prefs?.topics?.[topic as keyof TopicPreferences];
    const allowedChannels = data.channels ?? (topicPrefs ? this.enabledChannels(topicPrefs) : ['in_app'] as NotificationChannel[]);

    const dto = new CreateNotificationDto();
    dto.userId = data.userId;
    dto.title = data.title;
    dto.body = data.body;
    dto.channels = allowedChannels;
    dto.priority = data.priority ?? 'medium';
    dto.topic = data.topic;
    dto.metadata = data.metadata;

    const notification = await this.repository.create(dto);

    const results = await Promise.allSettled(
      allowedChannels.map((channel) => this.deliver(channel, notification, data)),
    );

    const failures = results.filter((r) => r.status === 'rejected').length;
    if (failures > 0) {
      this.logger.error(`${failures}/${allowedChannels.length} channels failed for user ${data.userId}`, undefined, NotificationService.name);
    }
  }

  private async deliver(
    channel: NotificationChannel,
    notification: NotificationDocument,
    data: IncomingNotification,
  ): Promise<void> {
    switch (channel) {
      case 'in_app':
        this.gateway.sendToUser(data.userId, 'notification', {
          id: notification._id.toString(),
          title: notification.title,
          body: notification.body,
          topic: notification.topic,
          priority: notification.priority,
          createdAt: notification.createdAt,
        });
        break;

      case 'email':
        if (data.emailAddress) {
          const emailPayload: EmailPayload = {
            to: data.emailAddress,
            subject: data.title,
            html: `<p>${data.body}</p>`,
          };
          await this.emailService.send(emailPayload);
        }
        break;

      case 'sms':
        if (data.phoneNumber) {
          const smsPayload: SmsPayload = { to: data.phoneNumber, body: data.body };
          await this.smsService.send(smsPayload);
        }
        break;

      case 'push':
        if (data.pushToken) {
          const pushPayload: PushPayload = {
            token: data.pushToken,
            title: data.title,
            body: data.body,
            data: data.metadata as Record<string, string> | undefined,
          };
          await this.pushService.send(pushPayload);
        }
        break;
    }
  }

  async getUserNotifications(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: NotificationDocument[]; total: number; page: number; limit: number }> {
    return this.repository.findByUserId(userId, page, limit);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    return this.repository.markAsRead(notificationId, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.getUnreadCount(userId);
  }

  async getPreferences(userId: string): Promise<PreferenceDocument | null> {
    return this.repository.getPreferences(userId);
  }

  async upsertPreferences(dto: NotificationPreferencesDto): Promise<PreferenceDocument> {
    return this.repository.upsertPreferences(dto);
  }

  private mapTopic(topic: string): string {
    const parts = topic.split('.');
    return parts.length > 0 ? parts[0] : 'general';
  }

  private enabledChannels(prefs: ChannelPreferences): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    if (prefs.email) channels.push('email');
    if (prefs.sms) channels.push('sms');
    if (prefs.push) channels.push('push');
    if (prefs.inApp) channels.push('in_app');
    return channels.length > 0 ? channels : ['in_app'];
  }
}
