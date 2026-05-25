import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InvestmentService } from '../investment.service';
import { InvestmentRepository } from '../investment.repository';
import { LoggerService } from '../../../common/logger.service';
import { PriceFeed } from '../schemas/price-feed.schema';
import { ProductEntity } from '../entities/product.entity';

describe('InvestmentService', () => {
  let service: InvestmentService;
  let repository: InvestmentRepository;

  const mockProduct: ProductEntity = new ProductEntity({
    id: '1',
    name: 'Test Mutual Fund',
    type: 'MUTUAL_FUND',
    description: 'Test fund for unit tests',
    minInvestment: 100,
    maxInvestment: 100000,
    expectedReturn: 10,
    riskLevel: 'MEDIUM',
    status: 'ACTIVE',
  });

  const mockRepository = {
    findAllProducts: jest.fn<Promise<ProductEntity[]>, []>(),
    findProductById: jest.fn<Promise<ProductEntity | null>, [string]>(),
    createInvestment: jest.fn(),
    findInvestmentsByUserId: jest.fn(),
    findInvestmentById: jest.fn(),
    updateInvestmentStatus: jest.fn(),
    findMaturedActiveInvestments: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentService,
        {
          provide: InvestmentRepository,
          useValue: mockRepository,
        },
        {
          provide: LoggerService,
          useValue: mockLogger,
        },
        {
          provide: getModelToken(PriceFeed.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InvestmentService>(InvestmentService);
    repository = module.get<InvestmentRepository>(InvestmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products when no filters provided', async () => {
      mockRepository.findAllProducts.mockResolvedValue([mockProduct]);
      const result = await service.getProducts();
      expect(result).toEqual([mockProduct]);
      expect(mockRepository.findAllProducts).toHaveBeenCalledWith(undefined);
    });

    it('should filter products by type', async () => {
      mockRepository.findAllProducts.mockResolvedValue([mockProduct]);
      const result = await service.getProducts({ type: 'MUTUAL_FUND' });
      expect(result).toEqual([mockProduct]);
      expect(mockRepository.findAllProducts).toHaveBeenCalledWith({
        type: 'MUTUAL_FUND',
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product when found', async () => {
      mockRepository.findProductById.mockResolvedValue(mockProduct);
      const result = await service.getProductById('1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findProductById.mockResolvedValue(null);
      await expect(service.getProductById('999')).rejects.toThrowError(
        'Product with id 999 not found',
      );
    });
  });

  describe('buyInvestment', () => {
    const buyDto = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      productId: '1',
      amount: 5000,
    };

    it('should successfully buy an investment', async () => {
      mockRepository.findProductById.mockResolvedValue(mockProduct);
      mockRepository.createInvestment.mockResolvedValue({});

      const result = await service.buyInvestment(buyDto);

      expect(result.status).toBe('ACTIVE');
      expect(result.userId).toBe(buyDto.userId);
      expect(result.productId).toBe(buyDto.productId);
      expect(result.amount).toBe(buyDto.amount);
      expect(result.units).toBeGreaterThan(0);
    });

    it('should throw when product not found', async () => {
      mockRepository.findProductById.mockResolvedValue(null);
      await expect(service.buyInvestment(buyDto)).rejects.toThrowError(
        'Product with id 1 not found',
      );
    });

    it('should throw when amount is below minimum', async () => {
      mockRepository.findProductById.mockResolvedValue(mockProduct);
      await expect(
        service.buyInvestment({ ...buyDto, amount: 50 }),
      ).rejects.toThrowError(
        `Minimum investment for ${mockProduct.name} is ${mockProduct.minInvestment}`,
      );
    });

    it('should throw when product is not active', async () => {
      const inactiveProduct = new ProductEntity({
        ...mockProduct,
        status: 'INACTIVE',
      });
      mockRepository.findProductById.mockResolvedValue(inactiveProduct);
      await expect(service.buyInvestment(buyDto)).rejects.toThrowError(
        `Product ${inactiveProduct.name} is not available for purchase`,
      );
    });
  });

  describe('getPortfolio', () => {
    it('should return empty portfolio when no investments', async () => {
      mockRepository.findInvestmentsByUserId.mockResolvedValue([]);
      const result = await service.getPortfolio('user-1');
      expect(result.totalInvested).toBe(0);
      expect(result.currentValue).toBe(0);
      expect(result.totalReturns).toBe(0);
      expect(result.investments).toHaveLength(0);
    });
  });

  describe('withdrawInvestment', () => {
    const mockInvestment = {
      id: 'inv-1',
      userId: 'user-1',
      productId: '1',
      amount: 5000,
      units: 45.45,
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      maturityDate: new Date('2025-01-01'),
      returns: 0,
    };

    it('should successfully withdraw an active investment', async () => {
      mockRepository.findInvestmentById.mockResolvedValue(mockInvestment);
      mockRepository.findProductById.mockResolvedValue(mockProduct);
      mockRepository.updateInvestmentStatus.mockResolvedValue({});

      const result = await service.withdrawInvestment('inv-1', {
        userId: 'user-1',
      });

      expect(result.status).toBe('WITHDRAWN');
      expect(result.id).toBe('inv-1');
      expect(result.returns).toBeDefined();
    });

    it('should throw when investment not found', async () => {
      mockRepository.findInvestmentById.mockResolvedValue(null);
      await expect(
        service.withdrawInvestment('invalid', { userId: 'user-1' }),
      ).rejects.toThrowError('Investment with id invalid not found');
    });

    it('should throw when investment is not active', async () => {
      mockRepository.findInvestmentById.mockResolvedValue({
        ...mockInvestment,
        status: 'WITHDRAWN',
      });
      await expect(
        service.withdrawInvestment('inv-1', { userId: 'user-1' }),
      ).rejects.toThrowError('Investment inv-1 is already WITHDRAWN');
    });
  });
});
