import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationGateway } from './notification.gateway';
import { NotificationConsumer } from './notification.consumer';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { LoggerService } from '../../common/logger.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Preference, PreferenceSchema } from './schemas/preference.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Preference.name, schema: PreferenceSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    LoggerService,
    NotificationService,
    NotificationRepository,
    NotificationGateway,
    NotificationConsumer,
    EmailService,
    SmsService,
    PushService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
