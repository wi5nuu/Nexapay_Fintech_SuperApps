import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Producer } from 'kafkajs';
import { LoggerService } from '../../common/logger.service';
import { InvestmentRepository } from './investment.repository';
import { BuyInvestmentDto } from './dto/buy-investment.dto';
import { WithdrawInvestmentDto } from './dto/withdraw-investment.dto';
import { ProductEntity } from './entities/product.entity';
import { KafkaEvent } from './types/kafka-event.type';

interface ProductFilters {
  type?: string;
  riskLevel?: string;
}

interface PortfolioResult {
  userId: string;
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  investments: Record<string, unknown>[];
}

interface BuyResult {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  units: number;
  status: string;
}

interface WithdrawResult {
  id: string;
  status: string;
  returns: number;
  message: string;
}

@Injectable()
export class InvestmentService {
  private readonly kafkaProducer: Producer | null;

  constructor(
    private readonly repository: InvestmentRepository,
    private readonly logger: LoggerService,
  ) {
    this.kafkaProducer = null;
    this.initKafka();
  }

  private async initKafka(): Promise<void> {
    try {
      const { Kafka } = await import('kafkajs');
      const kafka = new Kafka({
        clientId: 'investment-service',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
      });
      const producer = kafka.producer();
      await producer.connect();
      this.kafkaProducer = producer;
      this.logger.log('Kafka producer connected', 'InvestmentService');
    } catch (error) {
      this.logger.warn(
        `Kafka unavailable, events will be logged only: ${(error as Error).message}`,
        'InvestmentService',
      );
    }
  }

  private async emitKafkaEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const event: KafkaEvent = {
      key: payload.id as string ?? uuidv4(),
      value: {
        eventType,
        timestamp: new Date().toISOString(),
        ...payload,
      },
    };

    this.logger.log(`Kafka event: ${eventType}`, 'InvestmentService');

    if (this.kafkaProducer) {
      try {
        await this.kafkaProducer.send({
          topic: eventType,
          messages: [
            {
              key: event.key,
              value: JSON.stringify(event.value),
            },
          ],
        });
      } catch (error) {
        this.logger.error(
          `Failed to emit Kafka event ${eventType}: ${(error as Error).message}`,
          undefined,
          'InvestmentService',
        );
      }
    }
  }

  async getProducts(filters?: ProductFilters): Promise<ProductEntity[]> {
    return this.repository.findAllProducts(filters);
  }

  async getProductById(id: string): Promise<ProductEntity> {
    const product = await this.repository.findProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async buyInvestment(dto: BuyInvestmentDto): Promise<BuyResult> {
    const product = await this.repository.findProductById(dto.productId);
    if (!product) {
      throw new NotFoundException(
        `Product with id ${dto.productId} not found`,
      );
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Product ${product.name} is not available for purchase`,
      );
    }

    const amount = dto.amount;
    if (amount < Number(product.minInvestment)) {
      throw new BadRequestException(
        `Minimum investment for ${product.name} is ${product.minInvestment}`,
      );
    }
    if (amount > Number(product.maxInvestment)) {
      throw new BadRequestException(
        `Maximum investment for ${product.name} is ${product.maxInvestment}`,
      );
    }

    const units = this.calculateUnits(amount, product);
    const id = uuidv4();
    const now = new Date();
    const maturityDate = new Date(now);
    maturityDate.setFullYear(maturityDate.getFullYear() + 1);

    await this.repository.createInvestment({
      id,
      userId: dto.userId,
      productId: dto.productId,
      amount,
      units,
      status: 'ACTIVE',
      startDate: now,
      maturityDate,
      returns: 0,
    });

    await this.emitKafkaEvent('investment.purchased', {
      id,
      userId: dto.userId,
      productId: dto.productId,
      amount,
      units,
    });

    this.logger.log(
      `Investment purchased: user=${dto.userId} product=${dto.productId} amount=${amount}`,
      'InvestmentService',
    );

    return { id, userId: dto.userId, productId: dto.productId, amount, units, status: 'ACTIVE' };
  }

  async getPortfolio(userId: string): Promise<PortfolioResult> {
    const investments = await this.repository.findInvestmentsByUserId(userId);

    if (investments.length === 0) {
      return {
        userId,
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        investments: [],
      };
    }

    const enrichedInvestments: Record<string, unknown>[] = [];
    let totalInvested = 0;
    let currentValue = 0;

    for (const inv of investments) {
      const product = await this.repository.findProductById(inv.productId);
      const unitPrice = product
        ? Number(product.expectedReturn) / 100 + 1
        : 1;
      const currentVal = inv.units * unitPrice;
      const returns = currentVal - inv.amount;

      totalInvested += inv.amount;
      currentValue += currentVal;

      enrichedInvestments.push({
        id: inv.id,
        productId: inv.productId,
        productName: product?.name ?? 'Unknown',
        productType: product?.type ?? 'UNKNOWN',
        amount: inv.amount,
        units: inv.units,
        status: inv.status,
        startDate: inv.startDate,
        maturityDate: inv.maturityDate,
        currentValue: Math.round(currentVal * 100) / 100,
        returns: Math.round(returns * 100) / 100,
      });
    }

    return {
      userId,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      totalReturns: Math.round((currentValue - totalInvested) * 100) / 100,
      investments: enrichedInvestments,
    };
  }

  async getInvestmentById(id: string): Promise<Record<string, unknown>> {
    const investment = await this.repository.findInvestmentById(id);
    if (!investment) {
      throw new NotFoundException(`Investment with id ${id} not found`);
    }

    const product = await this.repository.findProductById(investment.productId);
    const unitPrice = product ? Number(product.expectedReturn) / 100 + 1 : 1;
    const currentValue = investment.units * unitPrice;
    const returns = currentValue - investment.amount;

    return {
      id: investment.id,
      userId: investment.userId,
      productId: investment.productId,
      productName: product?.name ?? 'Unknown',
      productType: product?.type ?? 'UNKNOWN',
      amount: investment.amount,
      units: investment.units,
      status: investment.status,
      startDate: investment.startDate,
      maturityDate: investment.maturityDate,
      currentValue: Math.round(currentValue * 100) / 100,
      returns: Math.round(returns * 100) / 100,
    };
  }

  async withdrawInvestment(
    id: string,
    dto: WithdrawInvestmentDto,
  ): Promise<WithdrawResult> {
    const investment = await this.repository.findInvestmentById(id);
    if (!investment) {
      throw new NotFoundException(`Investment with id ${id} not found`);
    }

    if (investment.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Investment ${id} is already ${investment.status}`,
      );
    }

    const product = await this.repository.findProductById(investment.productId);
    const unitPrice = product ? Number(product.expectedReturn) / 100 + 1 : 1;
    const currentValue = investment.units * unitPrice;
    const returns = Math.round((currentValue - investment.amount) * 100) / 100;

    await this.repository.updateInvestmentStatus(id, 'WITHDRAWN', returns);

    await this.emitKafkaEvent('investment.withdrawn', {
      id,
      userId: dto.userId,
      productId: investment.productId,
      amount: investment.amount,
      returns,
      reason: dto.reason,
    });

    this.logger.log(
      `Investment withdrawn: id=${id} user=${dto.userId} returns=${returns}`,
      'InvestmentService',
    );

    return { id, status: 'WITHDRAWN', returns, message: 'Investment withdrawn successfully' };
  }

  private calculateUnits(amount: number, product: ProductEntity): number {
    const basePrice = 100;
    const returnRate = Number(product.expectedReturn) / 100;
    const unitPrice = basePrice * (1 + returnRate);
    return Math.round((amount / unitPrice) * 100) / 100;
  }

  async processMaturations(): Promise<void> {
    this.logger.log('Processing investment maturations', 'InvestmentService');
    const maturedInvestments =
      await this.repository.findMaturedActiveInvestments();

    for (const inv of maturedInvestments) {
      const product = await this.repository.findProductById(inv.productId);
      const unitPrice = product ? Number(product.expectedReturn) / 100 + 1 : 1;
      const returns = Math.round((inv.units * unitPrice - inv.amount) * 100) / 100;

      await this.repository.updateInvestmentStatus(inv.id, 'MATURED', returns);

      await this.emitKafkaEvent('investment.matured', {
        id: inv.id,
        userId: inv.userId,
        productId: inv.productId,
        amount: inv.amount,
        returns,
      });

      this.logger.log(
        `Investment matured: id=${inv.id} user=${inv.userId} returns=${returns}`,
        'InvestmentService',
      );
    }
  }
}
