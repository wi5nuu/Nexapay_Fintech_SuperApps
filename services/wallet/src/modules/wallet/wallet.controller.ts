import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { TopUpDto } from './dto/top-up.dto';
import { TransferDto } from './dto/transfer.dto';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/wallet.entity';

@ApiTags('Wallets')
@ApiBearerAuth()
@Controller('wallets')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new wallet for a user and currency' })
  @ApiResponse({ status: 201, description: 'Wallet created', type: Wallet })
  async createWallet(@Body() dto: CreateWalletDto): Promise<Wallet> {
    return this.walletService.createWallet(dto);
  }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wallet balance by userId and currency' })
  @ApiResponse({ status: 200, description: 'Wallet balance', type: Wallet })
  async getBalance(
    @Query('userId') userId: string,
    @Query('currency') currency: string,
  ): Promise<Wallet> {
    return this.walletService.getBalance(userId, currency ?? 'USD');
  }

  @Post('top-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit funds into wallet (idempotent)' })
  @ApiResponse({ status: 200, description: 'Top-up completed', type: Transaction })
  async topUp(@Body() dto: TopUpDto): Promise<Transaction> {
    return this.walletService.topUp(dto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'P2P transfer between wallets (SAGA pattern)' })
  @ApiResponse({ status: 200, description: 'Transfer completed', type: Transaction })
  async transfer(@Body() dto: TransferDto): Promise<Transaction> {
    return this.walletService.transfer(dto);
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get transaction history for a wallet' })
  @ApiResponse({ status: 200, description: 'Transaction list', type: [Transaction] })
  async getTransactions(
    @Query('walletId') walletId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> {
    return this.walletService.getTransactions(
      walletId,
      parseInt(page ?? '1', 10),
      Math.min(parseInt(limit ?? '20', 10), 100),
    );
  }

  @Get('statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get mini statement for a wallet' })
  @ApiResponse({ status: 200, description: 'Latest transactions', type: [Transaction] })
  async getStatement(@Query('walletId') walletId: string): Promise<Transaction[]> {
    return this.walletService.getStatement(walletId);
  }
}
