import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaClient, Prisma } from '@prisma/client';
import { PriceFeed, PriceFeedDocument } from './schemas/price-feed.schema';
import { Investment, InvestmentDocument } from './schemas/investment.schema';
import { ProductEntity } from './entities/product.entity';
import { LoggerService } from '../../common/logger.service';

interface CreateInvestmentInput {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  units: number;
  status: string;
  startDate: Date;
  maturityDate: Date;
  returns: number;
}

@Injectable()
export class InvestmentRepository implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor(
    @InjectModel(PriceFeed.name)
    private readonly priceFeedModel: Model<PriceFeedDocument>,
    @InjectModel(Investment.name)
    private readonly investmentModel: Model<InvestmentDocument>,
    private readonly logger: LoggerService,
  ) {
    this.prisma = new PrismaClient();
  }

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
    this.logger.log('Prisma connected to PostgreSQL', 'InvestmentRepository');
    await this.ensureMongoIndexes();
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }

  private async ensureMongoIndexes(): Promise<void> {
    try {
      await this.priceFeedModel.collection.createIndex(
        { productId: 1, timestamp: -1 },
        { background: true },
      );
      await this.priceFeedModel.collection.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 60 * 60 * 24 * 365 },
      );
    } catch (error) {
      this.logger.warn(
        `Mongo index creation issue: ${(error as Error).message}`,
        'InvestmentRepository',
      );
    }
  }

  // ─── Product queries (Prisma / PostgreSQL) ──────────────────────────

  async findAllProducts(filters?: {
    type?: string;
    riskLevel?: string;
  }): Promise<ProductEntity[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.riskLevel) {
      where.riskLevel = filters.riskLevel;
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => new ProductEntity({
      id: String(p.id),
      name: p.name,
      type: p.type,
      description: p.description,
      minInvestment: Number(p.minInvestment),
      maxInvestment: Number(p.maxInvestment),
      expectedReturn: Number(p.expectedReturn),
      riskLevel: p.riskLevel,
      status: p.status,
    }));
  }

  async findProductById(id: string): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return new ProductEntity({
      id: String(product.id),
      name: product.name,
      type: product.type,
      description: product.description,
      minInvestment: Number(product.minInvestment),
      maxInvestment: Number(product.maxInvestment),
      expectedReturn: Number(product.expectedReturn),
      riskLevel: product.riskLevel,
      status: product.status,
    });
  }

  // ─── Investment queries (Mongoose / MongoDB) ─────────────────────────

  async createInvestment(input: CreateInvestmentInput): Promise<InvestmentDocument> {
    const created = new this.investmentModel({
      _id: input.id,
      userId: input.userId,
      productId: input.productId,
      amount: input.amount,
      units: input.units,
      status: input.status,
      startDate: input.startDate,
      maturityDate: input.maturityDate,
      returns: input.returns,
    });
    return created.save();
  }

  async findInvestmentsByUserId(userId: string): Promise<InvestmentDocument[]> {
    return this.investmentModel.find({ userId }).exec();
  }

  async findInvestmentById(id: string): Promise<InvestmentDocument | null> {
    return this.investmentModel.findById(id).exec();
  }

  async updateInvestmentStatus(
    id: string,
    status: string,
    returns: number,
  ): Promise<InvestmentDocument | null> {
    return this.investmentModel
      .findByIdAndUpdate(id, { status, returns }, { new: true })
      .exec();
  }

  async findMaturedActiveInvestments(): Promise<InvestmentDocument[]> {
    return this.investmentModel
      .find({ status: 'ACTIVE', maturityDate: { $lte: new Date() } })
      .exec();
  }

  // ─── Price Feed (Mongoose / MongoDB) ──────────────────────────────

  async savePriceFeed(entry: {
    productId: string;
    price: number;
    timestamp: Date;
  }): Promise<PriceFeedDocument> {
    const created = new this.priceFeedModel({
      productId: entry.productId,
      price: entry.price,
      timestamp: entry.timestamp,
    });
    return created.save();
  }

  async getPriceHistory(
    productId: string,
    limit = 100,
  ): Promise<PriceFeedDocument[]> {
    return this.priceFeedModel
      .find({ productId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}
