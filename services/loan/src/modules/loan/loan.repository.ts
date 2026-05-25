import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { LoanEntity, RepaymentEntity, CreditScoreEntity } from './entities/loan.entity';

type LoanWithRepayments = Prisma.LoanGetPayload<{ include: { repayments: true } }>;
type RepaymentWithLoan = Prisma.RepaymentGetPayload<{ include: { loan: true } }>;

@Injectable()
export class LoanRepository extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async createLoan(data: {
    userId: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    purpose: string;
    creditScore: number;
    monthlyPayment: number;
    totalPayable: number;
  }): Promise<LoanWithRepayments> {
    return this.loan.create({ data, include: { repayments: true } });
  }

  async findLoanById(id: string): Promise<LoanWithRepayments | null> {
    return this.loan.findUnique({
      where: { id },
      include: { repayments: { orderBy: { dueDate: 'asc' } } },
    });
  }

  async findLoansByUserId(userId: string): Promise<LoanWithRepayments[]> {
    return this.loan.findMany({
      where: { userId },
      include: { repayments: { orderBy: { dueDate: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllLoans(skip = 0, take = 20): Promise<LoanWithRepayments[]> {
    return this.loan.findMany({
      skip,
      take,
      include: { repayments: { orderBy: { dueDate: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAllLoans(): Promise<number> {
    return this.loan.count();
  }

  async updateLoanStatus(
    id: string,
    data: {
      status: string;
      approvedAt?: Date;
      approvedBy?: string;
      rejectedAt?: Date;
      rejectedBy?: string;
      rejectedReason?: string;
      disbursedAt?: Date;
    },
  ): Promise<LoanWithRepayments> {
    return this.loan.update({
      where: { id },
      data,
      include: { repayments: true },
    });
  }

  async createRepayment(data: {
    loanId: string;
    dueDate: Date;
    amount: number;
  }): Promise<RepaymentEntity> {
    return this.repayment.create({ data });
  }

  async createRepayments(data: Array<{
    loanId: string;
    dueDate: Date;
    amount: number;
  }>): Promise<number> {
    const result = await this.repayment.createMany({ data });
    return result.count;
  }

  async findRepaymentsByLoanId(loanId: string): Promise<RepaymentEntity[]> {
    return this.repayment.findMany({
      where: { loanId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOverdueRepayments(): Promise<RepaymentWithLoan[]> {
    const now = new Date();
    return this.repayment.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['PENDING', 'LATE'] },
      },
      include: { loan: true },
    });
  }

  async updateRepayment(
    id: string,
    data: {
      paidAmount?: number;
      status?: string;
      paidAt?: Date;
      penaltyAmount?: number;
    },
  ): Promise<RepaymentEntity> {
    return this.repayment.update({
      where: { id },
      data,
    });
  }

  async upsertCreditScore(data: {
    userId: string;
    score: number;
    factors: Record<string, unknown>;
  }): Promise<CreditScoreEntity> {
    return this.creditScore.upsert({
      where: { userId: data.userId },
      create: data,
      update: { score: data.score, factors: data.factors, lastUpdated: new Date() },
    });
  }

  async findCreditScoreByUserId(userId: string): Promise<CreditScoreEntity | null> {
    return this.creditScore.findUnique({ where: { userId } });
  }

  async findRepaymentById(id: string): Promise<RepaymentEntity | null> {
    return this.repayment.findUnique({ where: { id } });
  }
}
