import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/client';

const DB_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS || 8_000);

function withConnectTimeout(url: string, seconds: number): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', String(seconds));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: PrismaClient;
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const timeoutSec = Math.max(1, Math.ceil(DB_CONNECT_TIMEOUT_MS / 1000));
    this.pool = new Pool({
      connectionString: withConnectTimeout(connectionString, timeoutSec),
      connectionTimeoutMillis: DB_CONNECT_TIMEOUT_MS,
      max: 10,
    });
    const adapter = new PrismaPg(this.pool);
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

  get paymentSession(): PrismaClient['paymentSession'] {
    return this.client.paymentSession;
  }

  get pushSubscription(): PrismaClient['pushSubscription'] {
    return this.client.pushSubscription;
  }

  get blogPost(): PrismaClient['blogPost'] {
    return this.client.blogPost;
  }

  $transaction<T>(
    fn: (
      tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction(fn);
  }

  async onModuleInit() {
    this.logger.log(`Connecting to database (timeout ${DB_CONNECT_TIMEOUT_MS}ms)…`);
    await this.client.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }
}
