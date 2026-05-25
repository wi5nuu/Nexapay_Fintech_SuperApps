import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './modules/user/user.module';
import { KycModule } from './modules/kyc/kyc.module';
import { LoggerService } from './common/logger.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/nexapay-kyc'),
    UserModule,
    KycModule,
  ],
  providers: [
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [LoggerService],
})
export class AppModule {}
