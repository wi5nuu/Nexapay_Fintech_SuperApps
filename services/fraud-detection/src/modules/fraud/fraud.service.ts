import { Injectable, Inject, OnModuleInit, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { Kafka, Producer } from 'kafkajs';
import { FraudRepository } from './fraud.repository';
import { LoggerService } from '../../common/logger.service';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { CreateRuleDto } from './dto/create-rule.dto';
import { ReviewFlagDto } from './dto/review-flag.dto';
import { Rule, RuleAction, RuleType } from './entities/rule.entity';

export interface FraudFlag {
  id: string;
  ruleId: string;
  ruleName: string;
  userId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'reviewed' | 'dismissed';
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface FraudCheckResponse {
  allowed: boolean;
  hasFlags: boolean;
  flags: FraudFlag[];
}

@Injectable()
export class FraudService implements OnModuleInit {
  private producer!: Producer;

  constructor(
    private readonly fraudRepository: FraudRepository,
    @Inject('KAFKA_CLIENT') private readonly kafka: Kafka,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
    await this.initializeDefaultRules();
  }

  private async initializeDefaultRules(): Promise<void> {
    const existingCount = await this.redis.llen('rules:list');
    if (existingCount > 0) return;

    const defaults = [
      {
        name: 'High Amount Threshold',
        type: RuleType.AMOUNT_THRESHOLD,
        config: { maxAmount: 10000 },
        enabled: true,
        action: RuleAction.FLAG,
      },
      {
        name: 'Per-User Velocity',
        type: RuleType.VELOCITY_PER_USER,
        config: { maxCount: 10, windowMinutes: 5 },
        enabled: true,
        action: RuleAction.FLAG,
      },
      {
        name: 'Per-IP Velocity',
        type: RuleType.VELOCITY_PER_IP,
        config: { maxCount: 20, windowMinutes: 5 },
        enabled: true,
        action: RuleAction.FLAG,
      },
      {
        name: 'New Device Detection',
        type: RuleType.NEW_DEVICE,
        config: {},
        enabled: true,
        action: RuleAction.FLAG,
      },
      {
        name: 'Geo Anomaly Detection',
        type: RuleType.GEO_ANOMALY,
        config: {},
        enabled: true,
        action: RuleAction.FLAG,
      },
    ];

    for (const ruleData of defaults) {
      const id = this.generateId();
      const rule: Rule = {
        id,
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.redis.set(`rules:${id}`, JSON.stringify(rule));
      await this.redis.rpush('rules:list', id);
    }
    this.logger.log(`Initialized ${defaults.length} default fraud rules`);
  }

  private async getAllRules(): Promise<Rule[]> {
    const ids = await this.redis.lrange('rules:list', 0, -1);
    if (ids.length === 0) return [];
    const keys = ids.map((id) => `rules:${id}`);
    const values = await this.redis.mget(keys);
    return values
      .filter((v): v is string => v !== null)
      .map((v) => JSON.parse(v) as Rule);
  }

  private async saveRule(rule: Rule): Promise<void> {
    await this.redis.set(`rules:${rule.id}`, JSON.stringify(rule));
  }

  private async saveFlag(flag: FraudFlag): Promise<void> {
    await this.redis.set(`flags:${flag.id}`, JSON.stringify(flag));
    await this.redis.rpush('flags:list', flag.id);
  }

  private async getAllFlags(): Promise<FraudFlag[]> {
    const ids = await this.redis.lrange('flags:list', 0, -1);
    if (ids.length === 0) return [];
    const keys = ids.map((id) => `flags:${id}`);
    const values = await this.redis.mget(keys);
    return values
      .filter((v): v is string => v !== null)
      .map((v) => JSON.parse(v) as FraudFlag);
  }

  async checkTransaction(dto: CheckTransactionDto): Promise<FraudCheckResponse> {
    const flags: FraudFlag[] = [];
    const timestamp = Date.now();
    let shouldBlock = false;
    const rules = await this.getAllRules();

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const triggered = await this.evaluateRule(rule, dto, timestamp);
      if (triggered) {
        const flag = this.createFlag(rule, dto);
        flags.push(flag);
        await this.saveFlag(flag);
        this.logger.warn('Fraud rule triggered', {
          rule: rule.name,
          userId: dto.userId,
          ruleId: rule.id,
          action: rule.action,
        });

        if (rule.action === RuleAction.BLOCK) {
          shouldBlock = true;
        }
      }
    }

    const freezeThreshold = parseInt(process.env.FREEZE_THRESHOLD || '3', 10);
    if (flags.length >= freezeThreshold) {
      this.logger.warn(`Freeze threshold breached for user ${dto.userId}`, {
        flagCount: flags.length,
        threshold: freezeThreshold,
      });
      await this.freezeAccount(dto.userId);
      shouldBlock = true;
    }

    if (flags.length > 0) {
      await this.emitFraudAlert(dto, flags);
    }

    return { allowed: !shouldBlock, hasFlags: flags.length > 0, flags };
  }

  private async evaluateRule(
    rule: Rule,
    dto: CheckTransactionDto,
    timestamp: number,
  ): Promise<boolean> {
    switch (rule.type) {
      case RuleType.AMOUNT_THRESHOLD: {
        const maxAmount = (rule.config['maxAmount'] as number) ?? 10000;
        return dto.amount > maxAmount;
      }

      case RuleType.VELOCITY_PER_USER: {
        const maxCount = (rule.config['maxCount'] as number) ?? 10;
        const windowMinutes = (rule.config['windowMinutes'] as number) ?? 5;
        const key = `fraud:velocity:user:${dto.userId}`;
        const now = timestamp;
        const windowStart = now - windowMinutes * 60 * 1000;
        const count = await this.fraudRepository.countInWindow(key, windowStart, now);
        await this.fraudRepository.addToWindow(key, `${dto.userId}:${now}`, now);
        return count >= maxCount;
      }

      case RuleType.VELOCITY_PER_IP: {
        const maxCount = (rule.config['maxCount'] as number) ?? 20;
        const windowMinutes = (rule.config['windowMinutes'] as number) ?? 5;
        const key = `fraud:velocity:ip:${dto.ipAddress}`;
        const now = timestamp;
        const windowStart = now - windowMinutes * 60 * 1000;
        const count = await this.fraudRepository.countInWindow(key, windowStart, now);
        await this.fraudRepository.addToWindow(key, `${dto.ipAddress}:${now}`, now);
        return count >= maxCount;
      }

      case RuleType.NEW_DEVICE: {
        if (dto.deviceId === 'unknown' || !dto.deviceId) return false;
        const isNew = await this.fraudRepository.isNewDevice(dto.userId, dto.deviceId);
        if (isNew) {
          await this.fraudRepository.associateDevice(dto.userId, dto.deviceId);
        }
        return isNew;
      }

      case RuleType.GEO_ANOMALY: {
        if (!dto.location || dto.location === 'unknown') return false;
        const lastLocation = await this.fraudRepository.getLastLocation(dto.userId);
        if (lastLocation !== null && lastLocation !== dto.location) {
          return true;
        }
        await this.fraudRepository.setLastLocation(dto.userId, dto.location);
        return false;
      }

      default:
        return false;
    }
  }

  private createFlag(rule: Rule, dto: CheckTransactionDto): FraudFlag {
    return {
      id: this.generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      userId: dto.userId,
      reason: `${rule.name} triggered for user ${dto.userId}`,
      severity: rule.action === RuleAction.FREEZE ? 'critical' : 'medium',
      status: 'open',
      metadata: {
        amount: dto.amount,
        currency: dto.currency,
        transactionType: dto.transactionType,
        ipAddress: dto.ipAddress,
        deviceId: dto.deviceId,
        location: dto.location,
      },
      createdAt: new Date(),
    };
  }

  async createRule(dto: CreateRuleDto): Promise<Rule> {
    const rule: Rule = {
      id: this.generateId(),
      name: dto.name,
      type: dto.type,
      config: dto.config,
      enabled: dto.enabled ?? true,
      action: dto.action,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.saveRule(rule);
    await this.redis.rpush('rules:list', rule.id);
    this.logger.log('Fraud rule created', { ruleId: rule.id, name: rule.name, type: rule.type });
    return rule;
  }

  async getRules(): Promise<Rule[]> {
    return this.getAllRules();
  }

  async getFlags(status?: string): Promise<FraudFlag[]> {
    const flags = await this.getAllFlags();
    if (status) {
      return flags.filter((f) => f.status === status);
    }
    return flags;
  }

  async reviewFlag(id: string, dto: ReviewFlagDto): Promise<FraudFlag> {
    const raw = await this.redis.get(`flags:${id}`);
    if (!raw) {
      throw new NotFoundException(`Fraud flag with id "${id}" not found`);
    }
    const flag: FraudFlag = JSON.parse(raw);
    flag.status = dto.status;
    flag.metadata['reviewedAt'] = new Date().toISOString();
    await this.redis.set(`flags:${id}`, JSON.stringify(flag));
    this.logger.log('Fraud flag reviewed', { flagId: id, newStatus: dto.status });
    return flag;
  }

  async freezeAccount(accountId: string): Promise<void> {
    await this.fraudRepository.setFrozen(accountId, true);
    this.logger.warn(`Account frozen due to fraud: ${accountId}`);
    await this.emitFraudAlert(
      {
        userId: accountId,
        amount: 0,
        currency: 'USD',
        ipAddress: '',
        deviceId: 'unknown',
        location: 'unknown',
        transactionType: 'freeze',
      },
      [],
    );
  }

  async isFrozen(accountId: string): Promise<boolean> {
    return this.fraudRepository.isFrozen(accountId);
  }

  private async emitFraudAlert(dto: CheckTransactionDto, flags: FraudFlag[]): Promise<void> {
    try {
      await this.producer.send({
        topic: 'fraud.alert',
        messages: [
          {
            key: dto.userId,
            value: JSON.stringify({
              event: 'fraud.alert',
              userId: dto.userId,
              amount: dto.amount,
              currency: dto.currency,
              flags: flags.map((f) => ({
                ruleId: f.ruleId,
                ruleName: f.ruleName,
                reason: f.reason,
                severity: f.severity,
              })),
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      this.logger.log('Fraud alert emitted to Kafka', {
        userId: dto.userId,
        flagCount: flags.length,
      });
    } catch (error) {
      this.logger.error('Failed to emit fraud alert to Kafka', error as Error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredData(): Promise<void> {
    this.logger.log('Starting scheduled cleanup of expired Redis keys');
    const keys = await this.fraudRepository.scanKeys('fraud:velocity:*');
    if (keys.length > 0) {
      await this.fraudRepository.deleteKeys(keys);
      this.logger.log(`Cleaned ${keys.length} expired velocity counter keys`);
    } else {
      this.logger.log('No expired velocity keys to clean');
    }
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
