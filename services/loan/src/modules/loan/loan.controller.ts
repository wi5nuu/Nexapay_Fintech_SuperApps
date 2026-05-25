import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { LoanService } from './loan.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { LoanEntity, RepaymentEntity, CreditScoreEntity } from './entities/loan.entity';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller({ path: 'loans', version: '1' })
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply for a new loan' })
  async applyForLoan(
    @Req() req: Request,
    @Body() dto: ApplyLoanDto,
  ): Promise<LoanEntity> {
    const userId = req['user']?.['id'] ?? req['userId'] as string;
    return this.loanService.applyForLoan(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all loans (optionally filter by userId)' })
  @ApiQuery({ name: 'userId', required: false })
  async getLoans(
    @Query('userId') userId?: string,
  ): Promise<LoanEntity[]> {
    return this.loanService.getLoans(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan by ID' })
  async getLoanById(
    @Param('id') id: string,
  ): Promise<LoanEntity> {
    return this.loanService.getLoanById(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending loan (admin)' })
  async approveLoan(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: ApproveLoanDto,
  ): Promise<LoanEntity> {
    const adminId = req['user']?.['id'] ?? 'system';
    return this.loanService.approveLoan(id, adminId, dto.reason);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending loan (admin)' })
  async rejectLoan(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: RejectLoanDto,
  ): Promise<LoanEntity> {
    const adminId = req['user']?.['id'] ?? 'system';
    return this.loanService.rejectLoan(id, adminId, dto.reason);
  }

  @Get(':id/repayments')
  @ApiOperation({ summary: 'Get repayment schedule for a loan' })
  async getRepayments(
    @Param('id') id: string,
  ): Promise<RepaymentEntity[]> {
    return this.loanService.getRepayments(id);
  }

  @Post(':id/repay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make a repayment on a loan' })
  async repayLoan(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: RepayLoanDto,
  ): Promise<RepaymentEntity> {
    const userId = req['user']?.['id'] ?? req['userId'] as string;
    return this.loanService.repayLoan(id, userId, dto);
  }

  @Get('credit-score/:userId')
  @ApiOperation({ summary: 'Get credit score for a user' })
  async getCreditScore(
    @Param('userId') userId: string,
  ): Promise<CreditScoreEntity | null> {
    return this.loanService.getCreditScore(userId);
  }
}