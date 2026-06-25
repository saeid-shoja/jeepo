import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
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

  get library(): PrismaClient['library'] {
    return this.client.library;
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

  get auctionBid(): PrismaClient['auctionBid'] {
    return this.client.auctionBid;
  }

  get messageBatch(): PrismaClient['messageBatch'] {
    return this.client.messageBatch;
  }

  get userMessage(): PrismaClient['userMessage'] {
    return this.client.userMessage;
  }

  get favorite(): PrismaClient['favorite'] {
    return this.client.favorite;
  }

  get productConversation(): PrismaClient['productConversation'] {
    return this.client.productConversation;
  }

  get productChatMessage(): PrismaClient['productChatMessage'] {
    return this.client.productChatMessage;
  }

  get pendingRegistration(): PrismaClient['pendingRegistration'] {
    return this.client.pendingRegistration;
  }

  $transaction<T>(
    fn: (
      tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction(fn);
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
