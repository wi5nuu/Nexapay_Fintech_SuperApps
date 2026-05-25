import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { Inject, forwardRef } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { LoggerService } from '../../common/logger.service';

// GraphQL type stubs — in production, generate these via code-first approach
@Resolver()
export class InvestmentResolver {
  constructor(
    private readonly investmentService: InvestmentService,
    private readonly logger: LoggerService,
  ) {}

  @Query(() => String)
  async healthCheck(): Promise<string> {
    return 'Investment Service is running';
  }

  @Query(() => [Object])
  async products(
    @Args('type', { nullable: true }) type?: string,
    @Args('riskLevel', { nullable: true }) riskLevel?: string,
  ): Promise<Record<string, unknown>[]> {
    const products = await this.investmentService.getProducts({ type, riskLevel });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      description: p.description,
      minInvestment: p.minInvestment,
      maxInvestment: p.maxInvestment,
      expectedReturn: p.expectedReturn,
      riskLevel: p.riskLevel,
      status: p.status,
    }));
  }

  @Query(() => Object)
  async product(
    @Args('id') id: string,
  ): Promise<Record<string, unknown>> {
    const product = await this.investmentService.getProductById(id);
    return {
      id: product.id,
      name: product.name,
      type: product.type,
      description: product.description,
      minInvestment: product.minInvestment,
      maxInvestment: product.maxInvestment,
      expectedReturn: product.expectedReturn,
      riskLevel: product.riskLevel,
      status: product.status,
    };
  }

  @Query(() => Object)
  async portfolio(
    @Args('userId') userId: string,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.getPortfolio(userId);
  }

  @Query(() => Object)
  async investment(
    @Args('id') id: string,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.getInvestmentById(id);
  }

  @Mutation(() => Object)
  async buyInvestment(
    @Args('userId') userId: string,
    @Args('productId') productId: string,
    @Args('amount') amount: number,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.buyInvestment({ userId, productId, amount });
  }

  @Mutation(() => Object)
  async withdrawInvestment(
    @Args('id') id: string,
    @Args('userId') userId: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<Record<string, unknown>> {
    return this.investmentService.withdrawInvestment(id, { userId, reason });
  }
}
