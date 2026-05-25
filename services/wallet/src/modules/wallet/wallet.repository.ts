import { Injectable } from '@nestjs/common';
import {
  PrismaClient,
  Prisma,
  Wallet as PrismaWallet,
  Transaction as PrismaTransaction,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { WalletLogger } from '../../common/logger.service';

@Injectable()
export class WalletRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: WalletLogger,
  ) {}

  async findWallet(userId: string, currency: string): Promise<PrismaWallet | null> {
    return this.prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
  }

  async findWalletById(id: string): Promise<PrismaWallet | null> {
    return this.prisma.wallet.findUnique({ where: { id } });
  }

  async createWallet(userId: string, currency: string): Promise<PrismaWallet> {
    return this.prisma.wallet.create({
      data: { userId, currency, balance: 0 },
    });
  }

  async findByIdempotencyKey(key: string): Promise<PrismaTransaction | null> {
    return this.prisma.transaction.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async executeTopUp(
    walletId: string,
    amount: number,
    currency: string,
    idempotencyKey: string,
    description?: string,
  ): Promise<PrismaTransaction> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const previousBalance = Number(wallet.balance);
      const newBalance = previousBalance + amount;

      const updated = await tx.wallet.update({
        where: { id: walletId, version: wallet.version },
        data: {
          balance: newBalance,
          version: { increment: 1 },
        },
      });

      if (updated.version !== wallet.version + 1) {
        this.logger.error(
          `Optimistic lock failed for wallet ${walletId}: expected version ${wallet.version}`,
          undefined,
          'WalletRepository',
        );
        throw new Error('version conflict');
      }

      const transaction = await tx.transaction.create({
        data: {
          idempotencyKey,
          toWalletId: walletId,
          amount,
          currency,
          type: TransactionType.TOP_UP,
          status: TransactionStatus.COMPLETED,
          description: description ?? 'Wallet top-up',
          metadata: {
            operation: 'TOP_UP',
            iso20022: {
              msgId: idempotencyKey,
              creDtTm: new Date().toISOString(),
              nbOfTxs: 1,
              ttlIntrBkSttlmAmt: amount,
              sttlmCcy: currency,
            },
          },
        },
      });

      await tx.balanceAuditLog.create({
        data: {
          walletId,
          previousBalance,
          newBalance,
          changeAmount: amount,
          transactionId: transaction.id,
          operation: 'TOP_UP',
          metadata: { idempotencyKey },
        },
      });

      return transaction;
    });
  }

  async executeTransfer(
    fromWallet: PrismaWallet,
    toWallet: PrismaWallet,
    amount: number,
    currency: string,
    idempotencyKey: string,
    description?: string,
  ): Promise<PrismaTransaction> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const freshFrom = await tx.wallet.findUnique({ where: { id: fromWallet.id } });
      if (!freshFrom || Number(freshFrom.balance) < amount) {
        throw new Error('Insufficient balance');
      }

      const fromPreviousBalance = Number(freshFrom.balance);
      const fromNewBalance = fromPreviousBalance - amount;
      const toPreviousBalance = Number(toWallet.balance);
      const toNewBalance = toPreviousBalance + amount;

      const updatedFrom = await tx.wallet.update({
        where: { id: fromWallet.id, version: freshFrom.version },
        data: {
          balance: fromNewBalance,
          version: { increment: 1 },
        },
      });

      if (updatedFrom.version !== freshFrom.version + 1) {
        throw new Error('version conflict');
      }

      const freshTo = await tx.wallet.findUnique({ where: { id: toWallet.id } });
      if (!freshTo) {
        throw new Error('Destination wallet not found');
      }

      await tx.wallet.update({
        where: { id: toWallet.id, version: freshTo.version },
        data: {
          balance: toNewBalance,
          version: { increment: 1 },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          idempotencyKey,
          fromWalletId: fromWallet.id,
          toWalletId: toWallet.id,
          amount,
          currency,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          description: description ?? 'P2P transfer',
          metadata: {
            operation: 'TRANSFER',
            iso20022: {
              msgId: idempotencyKey,
              creDtTm: new Date().toISOString(),
              nbOfTxs: 1,
              ttlIntrBkSttlmAmt: amount,
              sttlmCcy: currency,
              dbtr: { id: fromWallet.userId },
              cdtr: { id: toWallet.userId },
            },
          },
        },
      });

      await tx.balanceAuditLog.createMany({
        data: [
          {
            walletId: fromWallet.id,
            previousBalance: fromPreviousBalance,
            newBalance: fromNewBalance,
            changeAmount: -amount,
            transactionId: transaction.id,
            operation: 'DEBIT',
            metadata: { idempotencyKey },
          },
          {
            walletId: toWallet.id,
            previousBalance: toPreviousBalance,
            newBalance: toNewBalance,
            changeAmount: amount,
            transactionId: transaction.id,
            operation: 'CREDIT',
            metadata: { idempotencyKey },
          },
        ],
      });

      return transaction;
    });
  }

  async findTransactionsByWallet(
    walletId: string,
    skip: number,
    take: number,
  ): Promise<PrismaTransaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countTransactionsByWallet(walletId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        OR: [
          { fromWalletId: walletId },
          { toWalletId: walletId },
        ],
      },
    });
  }
}
