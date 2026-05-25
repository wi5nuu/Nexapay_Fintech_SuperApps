import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { WalletService } from './wallet.service';
import { Wallet, Transaction, TransactionType, TransactionStatus } from './entities/wallet.entity';
import { TopUpDto } from './dto/top-up.dto';
import { TransferDto } from './dto/transfer.dto';

@Resolver(() => Wallet)
export class WalletResolver {
  constructor(private readonly walletService: WalletService) {}

  @Query(() => Wallet, { name: 'wallet', description: 'Get wallet by userId and currency' })
  async getWallet(
    @Args('userId', { type: () => String }) userId: string,
    @Args('currency', { type: () => String, defaultValue: 'USD' }) currency: string,
  ): Promise<Wallet> {
    return this.walletService.getBalance(userId, currency);
  }

  @Query(() => Number, { name: 'balance', description: 'Get wallet balance' })
  async getBalance(
    @Args('userId', { type: () => String }) userId: string,
    @Args('currency', { type: () => String, defaultValue: 'USD' }) currency: string,
  ): Promise<number> {
    const wallet = await this.walletService.getBalance(userId, currency);
    return wallet.balance;
  }

  @Query(() => [Transaction], { name: 'transactions', description: 'Get transaction history for wallet' })
  async getTransactions(
    @Args('walletId', { type: () => String }) walletId: string,
    @Args('page', { type: () => Number, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit: number,
  ): Promise<Transaction[]> {
    const result = await this.walletService.getTransactions(walletId, page, limit);
    return result.data;
  }

  @Mutation(() => Transaction, { name: 'topUp', description: 'Top up wallet balance' })
  async topUp(@Args('input') dto: TopUpDto): Promise<Transaction> {
    return this.walletService.topUp(dto);
  }

  @Mutation(() => Transaction, { name: 'transfer', description: 'Transfer funds between wallets' })
  async transfer(@Args('input') dto: TransferDto): Promise<Transaction> {
    return this.walletService.transfer(dto);
  }

  @ResolveField(() => Number, { name: 'balance', description: 'Current wallet balance' })
  resolveBalance(@Parent() wallet: Wallet): number {
    return wallet.balance;
  }

  @ResolveField(() => [Transaction], { name: 'recentTransactions', description: 'Last 10 transactions' })
  async resolveRecentTransactions(@Parent() wallet: Wallet): Promise<Transaction[]> {
    const result = await this.walletService.getTransactions(wallet.id, 1, 10);
    return result.data;
  }
}

@Resolver(() => Transaction)
export class TransactionResolver {
  @ResolveField(() => String, { name: 'typeLabel', description: 'Human-readable transaction type' })
  resolveTypeLabel(@Parent() transaction: Transaction): string {
    const labels: Record<string, string> = {
      [TransactionType.TOP_UP]: 'Top Up',
      [TransactionType.TRANSFER]: 'Transfer',
      [TransactionType.WITHDRAWAL]: 'Withdrawal',
      [TransactionType.PAYMENT]: 'Payment',
    };
    return labels[transaction.type] ?? transaction.type;
  }

  @ResolveField(() => String, { name: 'statusLabel', description: 'Human-readable transaction status' })
  resolveStatusLabel(@Parent() transaction: Transaction): string {
    const labels: Record<string, string> = {
      [TransactionStatus.PENDING]: 'Pending',
      [TransactionStatus.COMPLETED]: 'Completed',
      [TransactionStatus.FAILED]: 'Failed',
      [TransactionStatus.REVERSED]: 'Reversed',
    };
    return labels[transaction.status] ?? transaction.status;
  }
}
