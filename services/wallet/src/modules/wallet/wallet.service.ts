import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { PrismaClient, TransactionStatus, TransactionType } from '@prisma/client';
import { ClientKafka } from '@nestjs/microservices';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { WalletRepository } from './wallet.repository';
import { WalletLogger } from '../../common/logger.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TopUpDto } from './dto/top-up.dto';
import { TransferDto } from './dto/transfer.dto';
import { Wallet, Transaction } from './entities/wallet.entity';

const BALANCE_CACHE_TTL = 60;

@Injectable()
export class WalletService {
  constructor(
    private readonly repository: WalletRepository,
    private readonly logger: WalletLogger,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async createWallet(dto: CreateWalletDto): Promise<Wallet> {
    this.logger.log(`Creating wallet for userId=${dto.userId} currency=${dto.currency ?? 'USD'}`, 'WalletService');

    const existing = await this.repository.findWallet(dto.userId, dto.currency ?? 'USD');
    if (existing) {
      throw new ConflictException('Wallet already exists for this user and currency');
    }

    const wallet = await this.repository.createWallet(dto.userId, dto.currency ?? 'USD');
    await this.cacheBalance(wallet.id, Number(wallet.balance));

    this.logger.log(`Wallet created: id=${wallet.id}`, 'WalletService');
    return {
      id: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      balance: Number(wallet.balance),
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getBalance(userId: string, currency: string): Promise<Wallet> {
    this.logger.log(`Fetching balance for userId=${userId} currency=${currency}`, 'WalletService');

    const wallet = await this.repository.findWallet(userId, currency);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const cachedBalance = await this.redis.get(`balance:${wallet.id}`);
    if (cachedBalance !== null) {
      return {
        ...wallet,
        balance: parseFloat(cachedBalance),
      };
    }

    await this.cacheBalance(wallet.id, Number(wallet.balance));
    return {
      id: wallet.id,
      userId: wallet.userId,
      currency: wallet.currency,
      balance: Number(wallet.balance),
      version: wallet.version,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async topUp(dto: TopUpDto): Promise<Transaction> {
    this.logger.log(`Top-up: userId=${dto.userId} amount=${dto.amount} currency=${dto.currency} key=${dto.idempotencyKey}`, 'WalletService');

    const wallet = await this.repository.findWallet(dto.userId, dto.currency);
    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user and currency');
    }

    const existingTx = await this.repository.findByIdempotencyKey(dto.idempotencyKey);
    if (existingTx) {
      this.logger.warn(`Idempotent top-up replay detected: key=${dto.idempotencyKey}`, 'WalletService');
      return this.mapTransaction(existingTx);
    }

    const transaction = await this.repository.executeTopUp(
      wallet.id,
      dto.amount,
      dto.currency,
      dto.idempotencyKey,
      dto.description,
    );

    await Promise.all([
      this.cacheBalance(wallet.id, Number(wallet.balance) + dto.amount),
      this.emitKafkaEvent('wallet.credited', {
        walletId: wallet.id,
        userId: dto.userId,
        amount: dto.amount,
        currency: dto.currency,
        transactionId: transaction.id,
        idempotencyKey: dto.idempotencyKey,
        timestamp: new Date().toISOString(),
      }),
    ]);

    this.logger.log(`Top-up completed: tx=${transaction.id} amount=${dto.amount}`, 'WalletService');
    return this.mapTransaction(transaction);
  }

  async transfer(dto: TransferDto): Promise<Transaction> {
    this.logger.log(
      `Transfer: from=${dto.fromWalletId} to=${dto.toWalletId} amount=${dto.amount} key=${dto.idempotencyKey}`,
      'WalletService',
    );

    if (dto.fromWalletId === dto.toWalletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    const existingTx = await this.repository.findByIdempotencyKey(dto.idempotencyKey);
    if (existingTx) {
      this.logger.warn(`Idempotent transfer replay detected: key=${dto.idempotencyKey}`, 'WalletService');
      return this.mapTransaction(existingTx);
    }

    const fromWallet = await this.repository.findWalletById(dto.fromWalletId);
    if (!fromWallet) {
      throw new NotFoundException('Source wallet not found');
    }

    const toWallet = await this.repository.findWalletById(dto.toWalletId);
    if (!toWallet) {
      throw new NotFoundException('Destination wallet not found');
    }

    const fromBalance = Number(fromWallet.balance);
    if (fromBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance: available=${fromBalance} required=${dto.amount}`,
      );
    }

    let transaction;
    try {
      transaction = await this.repository.executeTransfer(
        fromWallet,
        toWallet,
        dto.amount,
        dto.currency,
        dto.idempotencyKey,
        dto.description,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('version conflict')) {
        throw new ConflictException('Transfer failed due to concurrent modification. Please retry.');
      }
      throw error;
    }

    await Promise.all([
      this.cacheBalance(fromWallet.id, Number(fromWallet.balance) - dto.amount),
      this.cacheBalance(toWallet.id, Number(toWallet.balance) + dto.amount),
      this.emitKafkaEvent('wallet.debited', {
        walletId: fromWallet.id,
        userId: fromWallet.userId,
        amount: dto.amount,
        currency: dto.currency,
        transactionId: transaction.id,
        counterpartyWalletId: toWallet.id,
        idempotencyKey: dto.idempotencyKey,
        timestamp: new Date().toISOString(),
      }),
      this.emitKafkaEvent('wallet.credited', {
        walletId: toWallet.id,
        userId: toWallet.userId,
        amount: dto.amount,
        currency: dto.currency,
        transactionId: transaction.id,
        counterpartyWalletId: fromWallet.id,
        idempotencyKey: dto.idempotencyKey,
        timestamp: new Date().toISOString(),
      }),
    ]);

    this.logger.log(`Transfer completed: tx=${transaction.id} amount=${dto.amount}`, 'WalletService');
    return this.mapTransaction(transaction);
  }

  async getTransactions(
    walletId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    this.logger.log(`Fetching transactions: walletId=${walletId} page=${page} limit=${limit}`, 'WalletService');

    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.repository.findTransactionsByWallet(walletId, skip, limit),
      this.repository.countTransactionsByWallet(walletId),
    ]);

    return {
      data: transactions.map((tx) => this.mapTransaction(tx)),
      total,
      page,
      limit,
    };
  }

  async getStatement(walletId: string): Promise<Transaction[]> {
    this.logger.log(`Fetching mini statement: walletId=${walletId}`, 'WalletService');

    const wallet = await this.repository.findWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.repository.findTransactionsByWallet(walletId, 0, 10);
    return transactions.map((tx) => this.mapTransaction(tx));
  }

  private async cacheBalance(walletId: string, balance: number): Promise<void> {
    await this.redis.setex(`balance:${walletId}`, BALANCE_CACHE_TTL, balance.toString());
  }

  private async emitKafkaEvent(topic: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await this.kafkaClient.emit(topic, payload).toPromise();
      this.logger.log(`Kafka event emitted: topic=${topic}`, 'WalletService');
    } catch (error) {
      this.logger.error(
        `Failed to emit Kafka event: topic=${topic}`,
        error instanceof Error ? error.stack : undefined,
        'WalletService',
      );
    }
  }

  private mapTransaction(tx: Record<string, unknown>): Transaction {
    return {
      id: tx.id as string,
      idempotencyKey: tx.idempotencyKey as string,
      fromWalletId: tx.fromWalletId as string | null,
      toWalletId: tx.toWalletId as string | null,
      amount: Number(tx.amount),
      currency: tx.currency as string,
      type: tx.type as TransactionType,
      status: tx.status as TransactionStatus,
      description: tx.description as string | null,
      metadata: tx.metadata as Record<string, unknown> | null,
      createdAt: tx.createdAt as Date,
      updatedAt: tx.updatedAt as Date,
    };
  }

  // gRPC handlers
  async grpcGetBalance(data: { userId: string; currency: string }): Promise<{ balance: number; currency: string; userId: string }> {
    const wallet = await this.getBalance(data.userId, data.currency ?? 'USD');
    return { balance: wallet.balance, currency: wallet.currency, userId: wallet.userId };
  }

  async grpcValidateTransfer(data: {
    fromWalletId: string;
    amount: number;
    currency: string;
  }): Promise<{ valid: boolean; reason: string }> {
    const wallet = await this.repository.findWalletById(data.fromWalletId);
    if (!wallet) {
      return { valid: false, reason: 'Source wallet not found' };
    }
    if (Number(wallet.balance) < data.amount) {
      return { valid: false, reason: 'Insufficient balance' };
    }
    if (wallet.currency !== data.currency) {
      return { valid: false, reason: 'Currency mismatch' };
    }
    return { valid: true, reason: '' };
  }

  async grpcGetTransactionHistory(data: {
    walletId: string;
    page: number;
    limit: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const result = await this.getTransactions(data.walletId, data.page ?? 1, data.limit ?? 20);
    return { transactions: result.data, total: result.total };
  }
}
