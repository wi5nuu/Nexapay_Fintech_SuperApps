import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycRepository } from './kyc.repository';
import { DocumentSchema, DocumentModel } from './entities/kyc.entity';
import { LoggerService } from '../../common/logger.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentModel.name, schema: DocumentSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
            clientId: 'kyc-producer',
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
    UserModule,
  ],
  controllers: [KycController],
  providers: [KycService, KycRepository, LoggerService],
  exports: [KycService, KycRepository],
})
export class KycModule {}