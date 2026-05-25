import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { LoanService } from './loan.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { LoanEntity, RepaymentEntity, CreditScoreEntity } from './entities/loan.entity';

@Resolver(() => LoanEntity)
export class LoanResolver {
  constructor(private readonly loanService: LoanService) {}

  @Query(() => [LoanEntity])
  async loans(
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<LoanEntity[]> {
    return this.loanService.getLoans(userId);
  }

  @Query(() => LoanEntity)
  async loan(@Args('id') id: string): Promise<LoanEntity> {
    return this.loanService.getLoanById(id);
  }

  @Mutation(() => LoanEntity)
  async applyForLoan(
    @Args('input') dto: ApplyLoanDto,
    @Context() context: any,
  ): Promise<LoanEntity> {
    const userId = context.req?.user?.id || context.req?.user?.sub || 'unknown';
    return this.loanService.applyForLoan(userId, dto);
  }

  @Mutation(() => LoanEntity)
  async approveLoan(
    @Args('id') id: string,
    @Args('reason', { nullable: true }) reason?: string,
    @Context() context: any,
  ): Promise<LoanEntity> {
    const adminId = context.req?.user?.id || context.req?.user?.sub || 'admin-placeholder';
    return this.loanService.approveLoan(id, adminId, reason);
  }

  @Mutation(() => LoanEntity)
  async rejectLoan(
    @Args('id') id: string,
    @Args('reason') reason: string,
    @Context() context: any,
  ): Promise<LoanEntity> {
    const adminId = context.req?.user?.id || context.req?.user?.sub || 'admin-placeholder';
    return this.loanService.rejectLoan(id, adminId, reason);
  }

  @Query(() => [RepaymentEntity])
  async repayments(
    @Args('loanId') loanId: string,
  ): Promise<RepaymentEntity[]> {
    return this.loanService.getRepayments(loanId);
  }

  @Query(() => CreditScoreEntity, { nullable: true })
  async creditScore(
    @Args('userId') userId: string,
  ): Promise<CreditScoreEntity | null> {
    return this.loanService.getCreditScore(userId);
  }
}
