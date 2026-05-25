import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class FraudRepository {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async addToWindow(key: string, member: string, score: number): Promise<void> {
    await this.redis.zadd(key, score, member);
    await this.redis.expire(key, 86400);
  }

  async countInWindow(key: string, minScore: number, maxScore: number): Promise<number> {
    await this.redis.zremrangebyscore(key, minScore, maxScore);
    const count = await this.redis.zcard(key);
    return count;
  }

  async isNewDevice(userId: string, deviceId: string): Promise<boolean> {
    const result = await this.redis.sismember(`fraud:devices:${userId}`, deviceId);
    return result === 0;
  }

  async associateDevice(userId: string, deviceId: string): Promise<void> {
    await this.redis.sadd(`fraud:devices:${userId}`, deviceId);
  }

  async getLastLocation(userId: string): Promise<string | null> {
    return this.redis.get(`fraud:location:${userId}`);
  }

  async setLastLocation(userId: string, location: string): Promise<void> {
    await this.redis.set(`fraud:location:${userId}`, location);
  }

  async setFrozen(accountId: string, frozen: boolean): Promise<void> {
    const key = `fraud:frozen:${accountId}`;
    if (frozen) {
      await this.redis.set(key, 'true');
    } else {
      await this.redis.del(key);
    }
  }

  async isFrozen(accountId: string): Promise<boolean> {
    const result = await this.redis.get(`fraud:frozen:${accountId}`);
    return result === 'true';
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');
    return keys;
  }

  async deleteKeys(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
