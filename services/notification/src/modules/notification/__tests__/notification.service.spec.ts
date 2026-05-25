import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../notification.repository';
import { EmailService } from '../email.service';
import { SmsService } from '../sms.service';
import { PushService } from '../push.service';
import { NotificationGateway } from '../notification.gateway';
import { LoggerService } from '../../../common/logger.service';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { Preference, PreferenceDocument } from '../schemas/preference.schema';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: NotificationRepository;

  const mockNotificationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockPreferenceModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const mockEmail = { send: jest.fn().mockResolvedValue(true) };
  const mockSms = { send: jest.fn().mockResolvedValue(true) };
  const mockPush = { send: jest.fn().mockResolvedValue(true) };
  const mockGateway = { sendToUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        NotificationRepository,
        { provide: getModelToken(Notification.name), useValue: mockNotificationModel },
        { provide: getModelToken(Preference.name), useValue: mockPreferenceModel },
        { provide: EmailService, useValue: mockEmail },
        { provide: SmsService, useValue: mockSms },
        { provide: PushService, useValue: mockPush },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('processIncoming', () => {
    const data = {
      userId: '507f191e810c19729de860ea',
      title: 'Test Notification',
      body: 'This is a test body',
      topic: 'wallet.credited.notification',
      emailAddress: 'test@example.com',
    };

    it('should respect DND for non-critical notifications', async () => {
      mockPreferenceModel.findOne.mockResolvedValue({
        doNotDisturb: true,
        topics: {},
      });

      await service.processIncoming(data);
      expect(mockNotificationModel.create).not.toHaveBeenCalled();
    });

    it('should bypass DND for critical notifications', async () => {
      mockPreferenceModel.findOne.mockResolvedValue({
        doNotDisturb: true,
        topics: {},
      });
      mockNotificationModel.create.mockResolvedValue({ _id: 'abc', ...data, channels: ['in_app'], createdAt: new Date() });

      await service.processIncoming({ ...data, priority: 'critical' });
      expect(mockNotificationModel.create).toHaveBeenCalled();
    });

    it('should create notification and deliver via in_app by default', async () => {
      mockPreferenceModel.findOne.mockResolvedValue(null);
      mockNotificationModel.create.mockResolvedValue({ _id: 'abc', ...data, channels: ['in_app'], createdAt: new Date(), toObject: () => ({}) });

      await service.processIncoming(data);
      expect(mockNotificationModel.create).toHaveBeenCalled();
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(data.userId, 'notification', expect.any(Object));
    });
  });

  describe('markAsRead', () => {
    it('should call repository.markAsRead and return notification', async () => {
      const mockDoc = { _id: 'abc', status: 'read' } as unknown as NotificationDocument;
      mockNotificationModel.findOneAndUpdate.mockResolvedValue(mockDoc);

      const result = await service.markAsRead('abc', '507f191e810c19729de860ea');
      expect(mockNotificationModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count from repository', async () => {
      mockNotificationModel.countDocuments.mockResolvedValue(5);
      const result = await service.getUnreadCount('507f191e810c19729de860ea');
      expect(result).toBe(5);
    });
  });
});
