import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { computeActiveUntil, DEPRECATED_DELETE_MS } from './product-lifecycle.constants';

const LIFECYCLE_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class ProductLifecycleService implements OnModuleInit {
  private readonly logger = new Logger(ProductLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  onModuleInit() {
    void this.runScheduledLifecycle();
    setInterval(() => void this.runScheduledLifecycle(), LIFECYCLE_INTERVAL_MS);
  }

  async runScheduledLifecycle() {
    try {
      const deprecated = await this.deprecateExpiredAds();
      const deleted = await this.deleteExpiredDeprecatedAds();
      if (deprecated > 0 || deleted > 0) {
        this.logger.log(`Lifecycle: deprecated ${deprecated}, deleted ${deleted}`);
      }
    } catch (error) {
      this.logger.error('Product lifecycle job failed', error);
    }
  }

  async deprecateExpiredAds(): Promise<number> {
    const now = new Date();
    const expired = await this.prisma.product.findMany({
      where: {
        advertiser: 'CLIENT',
        status: 'ACTIVE',
        activeUntil: { lte: now },
        userId: { not: null },
      },
      select: { id: true, title: true, userId: true },
    });

    for (const product of expired) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: 'DEPRECATED', deprecatedAt: now },
      });

      if (product.userId) {
        await this.messagesService.sendNotificationToUser(
          product.userId,
          'آگهی شما منقضی شد',
          `آگهی «${product.title}» پس از ۳۰ روز منقضی شده است. تا ۱۰ روز دیگر در صورت عدم فعال‌سازی مجدد، به‌طور کامل حذف خواهد شد. از بخش «آگهی‌های من» می‌توانید آن را دوباره فعال کنید.`,
        );
      }
    }

    return expired.length;
  }

  async deleteExpiredDeprecatedAds(): Promise<number> {
    const cutoff = new Date(Date.now() - DEPRECATED_DELETE_MS);
    const stale = await this.prisma.product.findMany({
      where: {
        advertiser: 'CLIENT',
        status: 'DEPRECATED',
        deprecatedAt: { lte: cutoff },
      },
      select: { id: true },
    });

    if (stale.length === 0) return 0;

    await this.prisma.product.deleteMany({
      where: { id: { in: stale.map((p) => p.id) } },
    });

    return stale.length;
  }

  getActiveUntilForNewAd(): Date {
    return computeActiveUntil();
  }
}
