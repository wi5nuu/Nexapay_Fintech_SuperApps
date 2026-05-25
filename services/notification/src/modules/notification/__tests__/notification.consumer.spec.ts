import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumer } from '../notification.consumer';
import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../notification.repository';
import { EmailService } from '../email.service';
import { SmsService } from '../sms.service';
import { PushService } from '../push.service';
import { NotificationGateway } from '../notification.gateway';
import { LoggerService } from '../../../common/logger.service';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from '../schemas/notification.schema';
import { Preference } from '../schemas/preference.schema';

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
      disconnect: jest.fn(),
    }),
  })),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn(),
    incr: jest.fn(),
    ttl: jest.fn().mockResolvedValue(-2),
    quit: jest.fn(),
  }));
});

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const mockService = { processIncoming: jest.fn() };
  const mockRepo = {};
  const mockEmail = {};
  const mockSms = {};
  const mockPush = {};
  const mockGateway = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConsumer,
        { provide: NotificationService, useValue: mockService },
        { provide: NotificationRepository, useValue: mockRepo },
        { provide: EmailService, useValue: mockEmail },
        { provide: SmsService, useValue: mockSms },
        { provide: PushService, useValue: mockPush },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: LoggerService, useValue: mockLogger },
        { provide: getModelToken(Notification.name), useValue: {} },
        { provide: getModelToken(Preference.name), useValue: {} },
      ],
    }).compile();

    consumer = module.get<NotificationConsumer>(NotificationConsumer);
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  it('should have subscribedTopics with all required topics', () => {
    expect(consumer['subscribedTopics']).toContain('wallet.credited.notification');
    expect(consumer['subscribedTopics']).toContain('loan.disbursed.notification');
    expect(consumer['subscribedTopics']).toContain('kyc.verified.notification');
    expect(consumer['subscribedTopics']).toContain('fraud.alert.notification');
    expect(consumer['subscribedTopics']).toContain('investment.dividend.notification');
    expect(consumer['subscribedTopics']).toContain('wallet.debited.notification');
    expect(consumer['subscribedTopics']).toContain('loan.due.notification');
    expect(consumer['subscribedTopics']).toContain('kyc.rejected.notification');
    expect(consumer['subscribedTopics']).toContain('investment.matured.notification');
  });
});
