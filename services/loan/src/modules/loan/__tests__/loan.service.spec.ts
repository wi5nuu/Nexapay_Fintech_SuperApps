import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { LoanService } from '../loan.service';
import { LoanRepository } from '../loan.repository';
import { LoggerService } from '../../../common/logger.service';
import { ApplyLoanDto } from '../dto/apply-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { LoanEntity, RepaymentEntity, LoanStatus, RepaymentStatus } from '../entities/loan.entity';

describe('LoanService', () => {
  let service: LoanService;
  let repository: jest.Mocked<LoanRepository>;

  const mockLoan: LoanEntity = {
    id: 'loan-1',
    userId: 'user-1',
    amount: 5000,
    interestRate: 0.12,
    termMonths: 12,
    status: LoanStatus.PENDING,
    purpose: 'Business',
    creditScore: 650,
    monthlyPayment: 444.25,
    totalPayable: 5331.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    repayments: [],
  };

  const mockRepayment: RepaymentEntity = {
    id: 'repay-1',
    loanId: 'loan-1',
    dueDate: new Date(),
    amount: 444.25,
    paidAmount: 0,
    status: RepaymentStatus.PENDING,
    penaltyAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      createLoan: jest.fn(),
      findLoanById: jest.fn(),
      findLoansByUserId: jest.fn(),
      findAllLoans: jest.fn(),
      updateLoanStatus: jest.fn(),
      createRepayment: jest.fn(),
      createRepayments: jest.fn(),
      findRepaymentsByLoanId: jest.fn(),
      findOverdueRepayments: jest.fn(),
      updateRepayment: jest.fn(),
      upsertCreditScore: jest.fn(),
      findCreditScoreByUserId: jest.fn(),
      findRepaymentById: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        { provide: LoanRepository, useValue: mockRepository },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    repository = module.get(LoanRepository);
  });

  describe('applyForLoan', () => {
    it('should create a loan application with credit score', async () => {
      const dto: ApplyLoanDto = {
        amount: 5000,
        purpose: 'Business',
        termMonths: 12,
      };

      repository.findLoansByUserId.mockResolvedValue([]);
      repository.createLoan.mockResolvedValue(mockLoan);
      repository.upsertCreditScore.mockResolvedValue({
        id: 'cs-1',
        userId: 'user-1',
        score: 650,
        factors: {},
        lastUpdated: new Date(),
        createdAt: new Date(),
      });

      const result = await service.applyForLoan('user-1', dto);

      expect(result).toEqual(mockLoan);
      expect(repository.createLoan).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          amount: 5000,
          termMonths: 12,
          purpose: 'Business',
        }),
      );
      expect(repository.upsertCreditScore).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          score: expect.any(Number),
        }),
      );
    });
  });

  describe('getLoanById', () => {
    it('should return loan when found', async () => {
      repository.findLoanById.mockResolvedValue(mockLoan);

      const result = await service.getLoanById('loan-1');
      expect(result).toEqual(mockLoan);
    });

    it('should throw 404 when loan not found', async () => {
      repository.findLoanById.mockResolvedValue(null);

      await expect(service.getLoanById('nonexistent')).rejects.toThrow(HttpException);
    });
  });

  describe('getLoans', () => {
    it('should return all loans when no userId', async () => {
      repository.findAllLoans.mockResolvedValue([mockLoan]);

      const result = await service.getLoans();
      expect(result).toEqual([mockLoan]);
    });

    it('should filter by userId when provided', async () => {
      repository.findLoansByUserId.mockResolvedValue([mockLoan]);

      const result = await service.getLoans('user-1');
      expect(result).toEqual([mockLoan]);
      expect(repository.findLoansByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('approveLoan', () => {
    it('should approve a pending loan', async () => {
      const pendingLoan = { ...mockLoan, status: LoanStatus.PENDING };
      const approvedLoan = { ...mockLoan, status: LoanStatus.APPROVED };

      repository.findLoanById.mockResolvedValue(pendingLoan);
      repository.updateLoanStatus.mockResolvedValue(approvedLoan);
      repository.createRepayments.mockResolvedValue(12);
      repository.findLoanById.mockResolvedValue(approvedLoan);

      const result = await service.approveLoan('loan-1', 'admin-1');
      expect(result.status).toBe(LoanStatus.APPROVED);
    });

    it('should throw when loan is not pending', async () => {
      repository.findLoanById.mockResolvedValue({
        ...mockLoan,
        status: LoanStatus.ACTIVE,
      });

      await expect(
        service.approveLoan('loan-1', 'admin-1'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('rejectLoan', () => {
    it('should reject a pending loan', async () => {
      const pendingLoan = { ...mockLoan, status: LoanStatus.PENDING };
      const rejectedLoan = { ...mockLoan, status: LoanStatus.REJECTED };

      repository.findLoanById.mockResolvedValue(pendingLoan);
      repository.updateLoanStatus.mockResolvedValue(rejectedLoan);

      const result = await service.rejectLoan('loan-1', 'admin-1', 'Not eligible');
      expect(result.status).toBe(LoanStatus.REJECTED);
    });
  });

  describe('repayLoan', () => {
    it('should process repayment', async () => {
      const activeLoan = {
        ...mockLoan,
        status: LoanStatus.ACTIVE,
      };

      repository.findLoanById.mockResolvedValue(activeLoan);
      repository.findRepaymentsByLoanId.mockResolvedValue([mockRepayment]);
      repository.updateRepayment.mockResolvedValue({
        ...mockRepayment,
        paidAmount: 444.25,
        status: RepaymentStatus.PAID,
        paidAt: new Date(),
      });

      const dto: RepayLoanDto = { amount: 444.25 };
      const result = await service.repayLoan('loan-1', 'user-1', dto);

      expect(result).toBeDefined();
      expect(repository.updateRepayment).toHaveBeenCalled();
    });

    it('should throw for unauthorized user', async () => {
      repository.findLoanById.mockResolvedValue(mockLoan);

      await expect(
        service.repayLoan('loan-1', 'wrong-user', { amount: 100 }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getRepayments', () => {
    it('should return repayments for a loan', async () => {
      repository.findLoanById.mockResolvedValue(mockLoan);
      repository.findRepaymentsByLoanId.mockResolvedValue([mockRepayment]);

      const result = await service.getRepayments('loan-1');
      expect(result).toEqual([mockRepayment]);
    });
  });
});
