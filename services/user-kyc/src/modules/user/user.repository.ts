import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UserRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { kyc: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
      status?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.user.findMany({
      skip: skip ?? 0,
      take: take ?? 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}
