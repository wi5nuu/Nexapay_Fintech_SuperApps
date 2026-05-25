import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from '../wallet.service';
import { WalletRepository } from '../wallet.repository';
import { WalletLogger } from '../../../common/logger.service';
import { TransactionStatus, TransactionType } from '@prisma/client';

const mockRepository = {
  findWallet: jest.fn(),
  findWalletById: jest.fn(),
  createWallet: jest.fn(),
  findByIdempotencyKey: jest.fn(),
  executeTopUp: jest.fn(),
  executeTransfer: jest.fn(),
  findTransactionsByWallet: jest.fn(),
  countTransactionsByWallet: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockKafkaClient = {
  emit: jest.fn().mockReturnValue({ toPromise: jest.fn().mockResolvedValue(undefined) }),
};

const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
};

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: WalletRepository, useValue: mockRepository },
        { provide: WalletLogger, useValue: mockLogger },
        { provide: 'KAFKA_SERVICE', useValue: mockKafkaClient },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
  });

  const mockWallet = {
    id: 'wallet-uuid',
    userId: 'user-uuid',
    currency: 'USD',
    balance: 100.0,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'tx-uuid',
    idempotencyKey: 'key-uuid',
    fromWalletId: null,
    toWalletId: 'wallet-uuid',
    amount: 50.0,
    currency: 'USD',
    type: TransactionType.TOP_UP,
    status: TransactionStatus.COMPLETED,
    description: 'Top-up',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createWallet', () => {
    it('should create a wallet successfully', async () => {
      mockRepository.findWallet.mockResolvedValue(null);
      mockRepository.createWallet.mockResolvedValue(mockWallet);

      const result = await service.createWallet({ userId: 'user-uuid', currency: 'USD' });

      expect(result.id).toEqual('wallet-uuid');
      expect(result.balance).toEqual(100);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should throw ConflictException if wallet already exists', async () => {
      mockRepository.findWallet.mockResolvedValue(mockWallet);

      await expect(
        service.createWallet({ userId: 'user-uuid', currency: 'USD' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getBalance', () => {
    it('should return wallet balance', async () => {
      mockRepository.findWallet.mockResolvedValue(mockWallet);
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getBalance('user-uuid', 'USD');
      expect(result.balance).toEqual(100);
    });

    it('should return cached balance if available', async () => {
      mockRepository.findWallet.mockResolvedValue(mockWallet);
      mockRedis.get.mockResolvedValue('250');

      const result = await service.getBalance('user-uuid', 'USD');
      expect(result.balance).toEqual(250);
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      mockRepository.findWallet.mockResolvedValue(null);
      await expect(service.getBalance('nonexistent', 'USD')).rejects.toThrow(NotFoundException);
    });
  });

  describe('topUp', () => {
    const topUpDto = {
      userId: 'user-uuid',
      amount: 50.0,
      currency: 'USD',
      idempotencyKey: 'idem-key',
    };

    it('should complete a top-up successfully', async () => {
      mockRepository.findWallet.mockResolvedValue(mockWallet);
      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.executeTopUp.mockResolvedValue(mockTransaction);

      const result = await service.topUp(topUpDto);
      expect(result.status).toEqual(TransactionStatus.COMPLETED);
      expect(mockKafkaClient.emit).toHaveBeenCalledWith('wallet.credited', expect.any(Object));
    });

    it('should return existing transaction on idempotency replay', async () => {
      mockRepository.findWallet.mockResolvedValue(mockWallet);
      mockRepository.findByIdempotencyKey.mockResolvedValue(mockTransaction);

      const result = await service.topUp(topUpDto);
      expect(result.id).toEqual('tx-uuid');
      expect(mockRepository.executeTopUp).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockRepository.findWallet.mockResolvedValue(null);
      await expect(service.topUp(topUpDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('transfer', () => {
    const transferDto = {
      fromWalletId: 'wallet-a',
      toWalletId: 'wallet-b',
      amount: 30.0,
      currency: 'USD',
      idempotencyKey: 'transfer-key',
      description: 'P2P transfer',
    };

    const fromWallet = { ...mockWallet, id: 'wallet-a', balance: 100.0, version: 2 };
    const toWallet = { ...mockWallet, id: 'wallet-b', balance: 50.0, version: 1 };

    it('should complete a transfer successfully', async () => {
      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.findWalletById
        .mockResolvedValueOnce(fromWallet)
        .mockResolvedValueOnce(toWallet);
      mockRepository.executeTransfer.mockResolvedValue({
        ...mockTransaction,
        fromWalletId: 'wallet-a',
        toWalletId: 'wallet-b',
        type: TransactionType.TRANSFER,
      });

      const result = await service.transfer(transferDto);
      expect(result.type).toEqual(TransactionType.TRANSFER);
      expect(mockKafkaClient.emit).toHaveBeenCalledTimes(2);
    });

    it('should reject transfer to same wallet', async () => {
      await expect(
        service.transfer({ ...transferDto, toWalletId: 'wallet-a' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing on idempotency replay', async () => {
      mockRepository.findByIdempotencyKey.mockResolvedValue({
        ...mockTransaction,
        fromWalletId: 'wallet-a',
        toWalletId: 'wallet-b',
      });

      const result = await service.transfer(transferDto);
      expect(mockRepository.executeTransfer).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if source wallet missing', async () => {
      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.findWalletById.mockResolvedValueOnce(null);

      await expect(service.transfer(transferDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on insufficient balance', async () => {
      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.findWalletById
        .mockResolvedValueOnce({ ...fromWallet, balance: 10 })
        .mockResolvedValueOnce(toWallet);

      await expect(service.transfer(transferDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on optimistic lock failure', async () => {
      mockRepository.findByIdempotencyKey.mockResolvedValue(null);
      mockRepository.findWalletById
        .mockResolvedValueOnce(fromWallet)
        .mockResolvedValueOnce(toWallet);
      mockRepository.executeTransfer.mockRejectedValue(new Error('version conflict'));

      await expect(service.transfer(transferDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      mockRepository.findWalletById.mockResolvedValue(mockWallet);
      mockRepository.findTransactionsByWallet.mockResolvedValue([mockTransaction]);
      mockRepository.countTransactionsByWallet.mockResolvedValue(1);

      const result = await service.getTransactions('wallet-uuid', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.total).toEqual(1);
    });

    it('should throw NotFoundException for missing wallet', async () => {
      mockRepository.findWalletById.mockResolvedValue(null);
      await expect(service.getTransactions('invalid', 1, 20)).rejects.toThrow(NotFoundException);
    });
  });
});
