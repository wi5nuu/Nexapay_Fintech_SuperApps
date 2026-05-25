import { Injectable, OnModuleInit } from '@nestjs/common';
import { Consumer, ConsumerConfig, EachMessagePayload, Kafka, KafkaConfig } from 'kafkajs';
import { Redis } from 'ioredis';
import { LoggerService } from '../../common/logger.service';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './schemas/notification.schema';

interface KafkaNotificationMessage {
  userId: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  topic: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
  emailAddress?: string;
  phoneNumber?: string;
  pushToken?: string;
}

const TOPIC_PATTERN = /^.+\.notification$/;

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private readonly consumer: Consumer;
  private readonly redis: Redis;
  private readonly subscribedTopics: string[] = [
    'wallet.credited.notification',
    'wallet.debited.notification',
    'loan.disbursed.notification',
    'loan.due.notification',
    'kyc.verified.notification',
    'kyc.rejected.notification',
    'fraud.alert.notification',
    'investment.dividend.notification',
    'investment.matured.notification',
  ];

  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: LoggerService,
  ) {
    const kafkaConfig: KafkaConfig = {
      clientId: process.env.KAFKA_CLIENT_ID ?? 'nexapay-notification',
      brokers: (process.env.KAFKA_BROKER ?? 'localhost:9092').split(','),
    };
    const kafka = new Kafka(kafkaConfig);

    const consumerConfig: ConsumerConfig = {
      groupId: process.env.KAFKA_GROUP_ID ?? 'notification-group',
    };
    this.consumer = kafka.consumer(consumerConfig);

    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.redis.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.subscribedTopics, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => this.handleMessage(payload),
    });

    this.logger.log(`Kafka consumer subscribed to: ${this.subscribedTopics.join(', ')}`, NotificationConsumer.name);
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    try {
      if (!TOPIC_PATTERN.test(topic)) {
        return;
      }

      const rawValue = message.value?.toString();
      if (!rawValue) {
        this.logger.warn(`Empty message on topic ${topic}`, NotificationConsumer.name);
        return;
      }

      const data: KafkaNotificationMessage = JSON.parse(rawValue);

      if (await this.isDuplicate(data)) {
        this.logger.log(`Duplicate message skipped on topic ${topic}`, NotificationConsumer.name);
        return;
      }

      if (await this.isRateLimited(data.userId)) {
        this.logger.warn(`Rate limit exceeded for user ${data.userId}`, NotificationConsumer.name);
        return;
      }

      await this.notificationService.processIncoming(data);

      await this.setDeduplicationKey(data);
      await this.incrementRateCounter(data.userId);

      this.logger.log(`Processed message from ${topic} for user ${data.userId}`, NotificationConsumer.name);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process message from ${topic}: ${errMsg}`, undefined, NotificationConsumer.name);
    }
  }

  private async isDuplicate(data: KafkaNotificationMessage): Promise<boolean> {
    const dedupKey = `dedup:notif:${data.userId}:${data.topic}:${data.title}`;
    const exists = await this.redis.get(dedupKey);
    return exists !== null;
  }

  private async setDeduplicationKey(data: KafkaNotificationMessage): Promise<void> {
    const dedupKey = `dedup:notif:${data.userId}:${data.topic}:${data.title}`;
    await this.redis.setex(dedupKey, 300, '1');
  }

  private async isRateLimited(userId: string): Promise<boolean> {
    const key = `ratelimit:notif:${userId}`;
    const current = await this.redis.get(key);
    if (!current) {
      return false;
    }
    const limit = parseInt(process.env.NOTIFICATION_RATE_LIMIT ?? '50', 10);
    return parseInt(current, 10) >= limit;
  }

  private async incrementRateCounter(userId: string): Promise<void> {
    const key = `ratelimit:notif:${userId}`;
    const ttl = await this.redis.ttl(key);
    if (ttl === -2) {
      await this.redis.setex(key, 3600, '1');
    } else {
      await this.redis.incr(key);
    }
  }
}
