import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException, TooManyRequestsException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { LoanRepository } from './loan.repository';
import { LoggerService } from '../../common/logger.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import {
  LoanEntity,
  RepaymentEntity,
  CreditScoreEntity,
  LoanStatus,
  RepaymentStatus,
} from './entities/loan.entity';

interface CreditScoreResult {
  score: number;
  factors: Record<string, unknown>;
}

interface KafkaMessagePayload {
  event: string;
  loanId: string;
  userId: string;
  amount: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LoanService {
  private readonly redis: Redis;

  private static readonly INTEREST_RATES: Record<string, number> = {
    short: 0.08,
    medium: 0.12,
    long: 0.15,
  };

  private static readonly PENALTY_RATE_PER_DAY: number = 0.005;
  private static readonly GRACE_PERIOD_DAYS: number = 3;
  private static readonly REDIS_RATE_LIMIT_WINDOW: number = 3600;
  private static readonly REDIS_RATE_LIMIT_MAX: number = 3;

  constructor(
    private readonly repository: LoanRepository,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly logger: LoggerService,
  ) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async applyForLoan(
    userId: string,
    dto: ApplyLoanDto,
  ): Promise<LoanEntity> {
    const allowed = await this.checkRateLimit(userId);
    if (!allowed) {
      throw new TooManyRequestsException('Too many loan applications. Please try again later.');
    }

    const creditResult = await this.evaluateCreditScore(userId, dto);

    const termType = this.getTermType(dto.termMonths);
    const interestRate = LoanService.INTEREST_RATES[termType];

    const monthlyPayment = this.calculateMonthlyPayment(
      dto.amount,
      interestRate,
      dto.termMonths,
    );
    const totalPayable = monthlyPayment * dto.termMonths;

    const loan = await this.repository.createLoan({
      userId,
      amount: dto.amount,
      interestRate,
      termMonths: dto.termMonths,
      purpose: dto.purpose,
      creditScore: creditResult.score,
      monthlyPayment,
      totalPayable,
    });

    await this.repository.upsertCreditScore({
      userId,
      score: creditResult.score,
      factors: creditResult.factors,
    });

    this.logger.log(`Loan application created: ${loan.id} for user ${userId}`, 'LoanService');
    return loan;
  }

  async getLoans(userId?: string, skip = 0, take = 20): Promise<{ data: LoanEntity[]; total: number }> {
    if (userId) {
      const data = await this.repository.findLoansByUserId(userId);
      return { data, total: data.length };
    }
    const [data, total] = await Promise.all([
      this.repository.findAllLoans(skip, take),
      this.repository.countAllLoans(),
    ]);
    return { data, total };
  }

  async getLoanById(id: string): Promise<LoanEntity> {
    const loan = await this.repository.findLoanById(id);
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }

  async approveLoan(
    id: string,
    adminId: string,
    _reason?: string,
  ): Promise<LoanEntity> {
    const loan = await this.getLoanById(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException(`Cannot approve loan in status ${loan.status}`);
    }

    const now = new Date();
    const updatedLoan = await this.repository.updateLoanStatus(id, {
      status: LoanStatus.APPROVED,
      approvedAt: now,
      approvedBy: adminId,
    });

    await this.generateRepaymentSchedule(id, updatedLoan);

    await this.disburseLoan(id, adminId);

    this.logger.log(`Loan ${id} approved by admin ${adminId}`, 'LoanService');
    return updatedLoan;
  }

  async rejectLoan(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<LoanEntity> {
    const loan = await this.getLoanById(id);

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException(`Cannot reject loan in status ${loan.status}`);
    }

    const updatedLoan = await this.repository.updateLoanStatus(id, {
      status: LoanStatus.REJECTED,
      rejectedAt: new Date(),
      rejectedBy: adminId,
      rejectedReason: reason,
    });

    this.logger.log(`Loan ${id} rejected by admin ${adminId}: ${reason}`, 'LoanService');
    return updatedLoan;
  }

  async getRepayments(loanId: string): Promise<RepaymentEntity[]> {
    const loan = await this.getLoanById(loanId);
    return this.repository.findRepaymentsByLoanId(loan.id);
  }

  async repayLoan(
    loanId: string,
    userId: string,
    dto: RepayLoanDto,
  ): Promise<RepaymentEntity> {
    const loan = await this.getLoanById(loanId);

    if (loan.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (loan.status !== LoanStatus.ACTIVE) {
      throw new BadRequestException('Loan is not active for repayment');
    }

    const pendingRepayments = await this.repository.findRepaymentsByLoanId(loanId);
    const dueRepayments = pendingRepayments.filter(
      (r) => r.status === RepaymentStatus.PENDING || r.status === RepaymentStatus.LATE,
    );

    if (dueRepayments.length === 0) {
      throw new BadRequestException('All repayments are already paid');
    }

    let remainingAmount = dto.amount;
    let lastRepayment: RepaymentEntity | null = null;

    for (const repayment of dueRepayments) {
      if (remainingAmount <= 0) break;

      const dueAmount = repayment.amount + repayment.penaltyAmount;
      const paidForThis = Math.min(remainingAmount, dueAmount);
      remainingAmount -= paidForThis;

      const totalDue = repayment.amount + repayment.penaltyAmount;
      const newPaidAmount = repayment.paidAmount + paidForThis;
      const isFullyPaid = newPaidAmount >= totalDue;

      const updateData: {
        paidAmount: number;
        status?: string;
        paidAt?: Date;
      } = { paidAmount: newPaidAmount };

      if (isFullyPaid) {
        updateData.status = RepaymentStatus.PAID;
        updateData.paidAt = new Date();
      }

      lastRepayment = await this.repository.updateRepayment(repayment.id, updateData);
    }

    await this.checkAndCompleteLoan(loanId);

    await this.emitKafkaEvent({
      event: 'loan.repaid',
      loanId,
      userId,
      amount: dto.amount,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Repayment of ${dto.amount} received for loan ${loanId}`,
      'LoanService',
    );

    return lastRepayment!;
  }

  async getCreditScore(userId: string): Promise<CreditScoreEntity | null> {
    return this.repository.findCreditScoreByUserId(userId);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDailyPenalties(): Promise<void> {
    this.logger.log('Running daily late payment penalty check', 'LoanService');

    const overdueRepayments = await this.repository.findOverdueRepayments();

    for (const repayment of overdueRepayments) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(repayment.dueDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysOverdue < LoanService.GRACE_PERIOD_DAYS) continue;

      const penaltyAmount =
        repayment.amount * LoanService.PENALTY_RATE_PER_DAY * daysOverdue;

      const status = daysOverdue > 30 ? RepaymentStatus.DEFAULTED : RepaymentStatus.LATE;

      await this.repository.updateRepayment(repayment.id, {
        penaltyAmount,
        status,
      });

      if (status === RepaymentStatus.DEFAULTED) {
        const loan = await this.repository.findLoanById(repayment.loanId);
        if (loan && loan.status !== LoanStatus.DEFAULTED) {
          await this.repository.updateLoanStatus(repayment.loanId, {
            status: LoanStatus.DEFAULTED,
          });

          await this.emitKafkaEvent({
            event: 'loan.defaulted',
            loanId: repayment.loanId,
            userId: loan.userId,
            amount: loan.amount,
            timestamp: new Date().toISOString(),
          });

          this.logger.warn(
            `Loan ${repayment.loanId} marked as DEFAULTED`,
            'LoanService',
          );
        }
      }
    }

    this.logger.log(
      `Processed ${overdueRepayments.length} overdue repayments`,
      'LoanService',
    );
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    const key = `loan:rate:${userId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, LoanService.REDIS_RATE_LIMIT_WINDOW);
    }

    return current <= LoanService.REDIS_RATE_LIMIT_MAX;
  }

  private async evaluateCreditScore(userId: string, dto: ApplyLoanDto): Promise<CreditScoreResult> {
    const factors: Record<string, unknown> = {};
    let score = 300;

    const existingLoans = await this.repository.findLoansByUserId(userId);
    const completedLoans = existingLoans.filter(
      (l) => l.status === LoanStatus.COMPLETED,
    );
    const activeLoans = existingLoans.filter(
      (l) => l.status === LoanStatus.ACTIVE,
    );
    const defaultedLoans = existingLoans.filter(
      (l) => l.status === LoanStatus.DEFAULTED,
    );

    if (defaultedLoans.length > 0) {
      score -= defaultedLoans.length * 100;
      factors.defaultedLoans = defaultedLoans.length;
    }

    if (completedLoans.length > 0) {
      const historyBonus = Math.min(completedLoans.length * 30, 150);
      score += historyBonus;
      factors.completedLoanHistory = completedLoans.length;
      factors.historyBonus = historyBonus;
    }

    const totalExistingDebt = activeLoans.reduce(
      (sum, loan) => sum + (loan.totalPayable || 0),
      0,
    );
    const debtToIncomeRatio = dto.amount / Math.max(totalExistingDebt + dto.amount, 1);

    if (debtToIncomeRatio > 0.5) {
      score -= 80;
      factors.highDebtRatio = true;
    } else if (debtToIncomeRatio > 0.3) {
      score -= 30;
      factors.moderateDebtRatio = true;
    }

    if (dto.amount > 10000) {
      score -= 20;
      factors.highAmount = true;
    } else if (dto.amount < 1000) {
      score += 10;
      factors.smallAmount = true;
    }

    if (dto.termMonths > 36) {
      score -= 15;
      factors.longTerm = true;
    }

    score = Math.max(0, Math.min(850, score));
    factors.finalScore = score;

    return { score, factors };
  }

  private getTermType(termMonths: number): string {
    if (termMonths <= 6) return 'short';
    if (termMonths <= 24) return 'medium';
    return 'long';
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number,
  ): number {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) return principal / termMonths;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(payment * 100) / 100;
  }

  private async generateRepaymentSchedule(
    loanId: string,
    loan: LoanEntity,
  ): Promise<void> {
    const repayments: Array<{
      loanId: string;
      dueDate: Date;
      amount: number;
    }> = [];

    const startDate = new Date();

    for (let i = 1; i <= loan.termMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      repayments.push({
        loanId,
        dueDate,
        amount: loan.monthlyPayment || 0,
      });
    }

    const count = await this.repository.createRepayments(repayments);
    this.logger.log(
      `Generated ${count} repayment schedules for loan ${loanId}`,
      'LoanService',
    );
  }

  private async disburseLoan(loanId: string, disbursedBy: string): Promise<void> {
    const loan = await this.getLoanById(loanId);

    await this.repository.updateLoanStatus(loanId, {
      status: LoanStatus.ACTIVE,
      disbursedAt: new Date(),
      approvedBy: disbursedBy,
    });

    await this.emitKafkaEvent({
      event: 'loan.disbursed',
      loanId,
      userId: loan.userId,
      amount: loan.amount,
      timestamp: new Date().toISOString(),
      metadata: {
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
      },
    });

    this.logger.log(`Loan ${loanId} disbursed`, 'LoanService');
  }

  private async checkAndCompleteLoan(loanId: string): Promise<void> {
    const repayments = await this.repository.findRepaymentsByLoanId(loanId);
    const allPaid = repayments.every(
      (r) => r.status === RepaymentStatus.PAID || r.status === RepaymentStatus.DEFAULTED,
    );

    if (allPaid) {
      const hasDefaulted = repayments.some((r) => r.status === RepaymentStatus.DEFAULTED);
      if (!hasDefaulted) {
        await this.repository.updateLoanStatus(loanId, {
          status: LoanStatus.COMPLETED,
        });
        this.logger.log(`Loan ${loanId} completed`, 'LoanService');
      }
    }
  }

  private async emitKafkaEvent(payload: KafkaMessagePayload): Promise<void> {
    try {
      await this.kafkaClient.emit('loan-events', {
        key: payload.loanId,
        value: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error(
        'Failed to emit Kafka event',
        error instanceof Error ? error.message : String(error),
        'LoanService',
      );
    }
  }
}
