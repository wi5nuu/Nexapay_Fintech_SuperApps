import { Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class TransactionProducerService {
  constructor(private readonly kafkaClient: ClientKafka) {}

  async publishTransactionCreated(transaction: any) {
    await this.kafkaClient.emit('transaction.created', transaction).toPromise();
  }
}
