import { Test, TestingModule } from '@nestjs/testing';
import { LoanController } from '../loan.controller';
import { LoanService } from '../loan.service';
import { ApplyLoanDto } from '../dto/apply-loan.dto';
import { RepayLoanDto } from '../dto/repay-loan.dto';
import { RejectLoanDto } from '../dto/reject-loan.dto';
import { LoanEntity, RepaymentEntity, LoanStatus, RepaymentStatus } from '../entities/loan.entity';

describe('LoanController', () => {
  let controller: LoanController;
  let service: jest.Mocked<LoanService>;

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
    paidAmount: 444.25,
    status: RepaymentStatus.PAID,
    penaltyAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      applyForLoan: jest.fn(),
      getLoans: jest.fn(),
      getLoanById: jest.fn(),
      approveLoan: jest.fn(),
      rejectLoan: jest.fn(),
      getRepayments: jest.fn(),
      repayLoan: jest.fn(),
      getCreditScore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoanController],
      providers: [{ provide: LoanService, useValue: mockService }],
    }).compile();

    controller = module.get<LoanController>(LoanController);
    service = module.get(LoanService);
  });

  describe('applyForLoan', () => {
    it('should call service.applyForLoan and return result', async () => {
      const dto: ApplyLoanDto = { amount: 5000, purpose: 'Business', termMonths: 12 };
      service.applyForLoan.mockResolvedValue(mockLoan);

      const result = await controller.applyForLoan(dto);
      expect(result).toEqual(mockLoan);
      expect(service.applyForLoan).toHaveBeenCalledWith('user-placeholder', dto);
    });
  });

  describe('getLoans', () => {
    it('should return all loans when no userId query', async () => {
      service.getLoans.mockResolvedValue([mockLoan]);

      const result = await controller.getLoans();
      expect(result).toEqual([mockLoan]);
      expect(service.getLoans).toHaveBeenCalledWith(undefined);
    });

    it('should filter by userId when provided', async () => {
      service.getLoans.mockResolvedValue([mockLoan]);

      const result = await controller.getLoans('user-1');
      expect(result).toEqual([mockLoan]);
      expect(service.getLoans).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getLoanById', () => {
    it('should return loan by id', async () => {
      service.getLoanById.mockResolvedValue(mockLoan);

      const result = await controller.getLoanById('loan-1');
      expect(result).toEqual(mockLoan);
      expect(service.getLoanById).toHaveBeenCalledWith('loan-1');
    });
  });

  describe('approveLoan', () => {
    it('should approve loan', async () => {
      const approved = { ...mockLoan, status: LoanStatus.APPROVED };
      service.approveLoan.mockResolvedValue(approved);

      const result = await controller.approveLoan('loan-1', { reason: 'Good credit' });
      expect(result).toEqual(approved);
      expect(service.approveLoan).toHaveBeenCalledWith('loan-1', 'admin-placeholder', 'Good credit');
    });
  });

  describe('rejectLoan', () => {
    it('should reject loan', async () => {
      const rejected = { ...mockLoan, status: LoanStatus.REJECTED };
      service.rejectLoan.mockResolvedValue(rejected);

      const dto: RejectLoanDto = { reason: 'Low credit score' };
      const result = await controller.rejectLoan('loan-1', dto);
      expect(result).toEqual(rejected);
      expect(service.rejectLoan).toHaveBeenCalledWith('loan-1', 'admin-placeholder', 'Low credit score');
    });
  });

  describe('getRepayments', () => {
    it('should return repayments for loan', async () => {
      service.getRepayments.mockResolvedValue([mockRepayment]);

      const result = await controller.getRepayments('loan-1');
      expect(result).toEqual([mockRepayment]);
      expect(service.getRepayments).toHaveBeenCalledWith('loan-1');
    });
  });

  describe('repayLoan', () => {
    it('should process repayment', async () => {
      service.repayLoan.mockResolvedValue(mockRepayment);

      const dto: RepayLoanDto = { amount: 444.25 };
      const result = await controller.repayLoan('loan-1', dto);
      expect(result).toEqual(mockRepayment);
      expect(service.repayLoan).toHaveBeenCalledWith('loan-1', 'user-placeholder', dto);
    });
  });

  describe('getCreditScore', () => {
    it('should return credit score for user', async () => {
      const mockCreditScore = {
        id: 'cs-1',
        userId: 'user-1',
        score: 720,
        factors: {},
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      service.getCreditScore.mockResolvedValue(mockCreditScore);

      const result = await controller.getCreditScore('user-1');
      expect(result).toEqual(mockCreditScore);
      expect(service.getCreditScore).toHaveBeenCalledWith('user-1');
    });
  });
});
