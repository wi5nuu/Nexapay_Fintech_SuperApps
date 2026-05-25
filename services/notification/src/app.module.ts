import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationModule } from './modules/notification/notification.module';
import { LoggerService } from './common/logger.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nexapay_notification'),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    NotificationModule,
  ],
  providers: [
    LoggerService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [LoggerService],
})
export class AppModule {}
