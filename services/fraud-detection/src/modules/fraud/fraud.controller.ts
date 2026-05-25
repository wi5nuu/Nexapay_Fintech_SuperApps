import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FraudService, FraudCheckResponse, FraudFlag } from './fraud.service';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { ReviewFlagDto } from './dto/review-flag.dto';
import { Rule } from './entities/rule.entity';

@ApiTags('fraud')
@ApiBearerAuth()
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check a transaction for fraud indicators' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fraud check completed' })
  async checkTransaction(@Body() dto: CheckTransactionDto): Promise<FraudCheckResponse> {
    return this.fraudService.checkTransaction(dto);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a new fraud detection rule (admin)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Rule created', type: Rule })
  async createRule(@Body() dto: CreateRuleDto): Promise<Rule> {
    return this.fraudService.createRule(dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all fraud detection rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of rules', type: [Rule] })
  async getRules(): Promise<Rule[]> {
    return this.fraudService.getRules();
  }

  @Get('flags')
  @ApiOperation({ summary: 'Get fraud flags, optionally filtered by status' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['open', 'reviewed', 'dismissed'],
    description: 'Filter by flag status',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of fraud flags' })
  async getFlags(@Query('status') status?: string): Promise<FraudFlag[]> {
    return this.fraudService.getFlags(status);
  }

  @Patch('flags/:id/review')
  @ApiOperation({ summary: 'Review a fraud flag (admin)' })
  @ApiParam({ name: 'id', description: 'Flag ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Flag reviewed' })
  async reviewFlag(
    @Param('id') id: string,
    @Body() dto: ReviewFlagDto,
  ): Promise<FraudFlag> {
    return this.fraudService.reviewFlag(id, dto);
  }

  @Post('accounts/:id/freeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Freeze an account due to fraud (admin)' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Account frozen' })
  async freezeAccount(
    @Param('id') id: string,
  ): Promise<{ frozen: boolean }> {
    await this.fraudService.freezeAccount(id);
    return { frozen: true };
  }

  @EventPattern('wallet.transaction.created')
  @EventPattern('loan.repayment.created')
  async handleTransactionEvent(@Payload() message: Record<string, unknown>): Promise<void> {
    const dto = new CheckTransactionDto();
    dto.userId = message['userId'] as string;
    dto.amount =
      typeof message['amount'] === 'number'
        ? message['amount']
        : Number(message['amount']);
    dto.currency = (message['currency'] as string) || 'USD';
    dto.ipAddress = (message['ipAddress'] as string) || '0.0.0.0';
    dto.deviceId = (message['deviceId'] as string) || 'unknown';
    dto.location = (message['location'] as string) || 'unknown';
    dto.transactionType =
      (message['transactionType'] as string) ||
      (message['type'] as string) ||
      'general';
    await this.fraudService.checkTransaction(dto);
  }
}
