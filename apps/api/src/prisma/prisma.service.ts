import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter });
  }

  get user(): PrismaClient['user'] {
    return this.client.user;
  }

  get category(): PrismaClient['category'] {
    return this.client.category;
  }

  get product(): PrismaClient['product'] {
    return this.client.product;
  }

  get order(): PrismaClient['order'] {
    return this.client.order;
  }

  get orderItem(): PrismaClient['orderItem'] {
    return this.client.orderItem;
  }

  get productCarBrand(): PrismaClient['productCarBrand'] {
    return this.client.productCarBrand;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
