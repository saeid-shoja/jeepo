import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AD_ACTIVE_DAYS,
  AD_ACTIVE_MS,
  computeActiveUntil,
  DEPRECATED_DELETE_DAYS,
  DEPRECATED_DELETE_MS,
} from './product-lifecycle.constants';

const LIFECYCLE_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class ProductLifecycleService implements OnModuleInit {
  private readonly logger = new Logger(ProductLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  onModuleInit() {
    // Delay first run so listen/health checks succeed before lifecycle DB work.
    setTimeout(() => void this.runScheduledLifecycle(), 30_000);
    setInterval(() => void this.runScheduledLifecycle(), LIFECYCLE_INTERVAL_MS);
  }

  async runScheduledLifecycle() {
    try {
      const shopCleared = await this.clearShopProductExpiry();
      const restored = await this.restoreClientAdsCoveredByNewLifetime();
      const synced = await this.syncClientActiveUntilFromListedAt();
      const purged = await this.purgeExpiredListingPaymentDrafts();
      const deprecated = await this.deprecateExpiredAds();
      const deleted = await this.deleteExpiredDeprecatedAds();
      if (
        shopCleared > 0 ||
        restored > 0 ||
        synced > 0 ||
        purged > 0 ||
        deprecated > 0 ||
        deleted > 0
      ) {
        this.logger.log(
          `Lifecycle: cleared shop expiry ${shopCleared}, restored within window ${restored}, synced client windows ${synced}, purged unpaid drafts ${purged}, deprecated ${deprecated}, deleted ${deleted}`,
        );
      }
    } catch (error) {
      this.logger.error('Product lifecycle job failed', error);
    }
  }

  /**
   * Shop catalog never expires — availability is stock-driven only.
   * Clears any leftover activeUntil timestamps.
   */
  async clearShopProductExpiry(): Promise<number> {
    const cleared = await this.prisma.product.updateMany({
      where: {
        advertiser: 'SHOP',
        activeUntil: { not: null },
      },
      data: {
        activeUntil: null,
        deprecatedAt: null,
      },
    });
    return cleared.count;
  }

  /**
   * After raising AD_ACTIVE_DAYS, bring back CLIENT ads that were deprecated
   * under the old window but are still inside listedAt + new lifetime.
   */
  async restoreClientAdsCoveredByNewLifetime(): Promise<number> {
    const now = new Date();
    const products = await this.prisma.product.findMany({
      where: {
        advertiser: 'CLIENT',
        status: 'DEPRECATED',
      },
      select: { id: true, listedAt: true, createdAt: true },
    });

    let restored = 0;
    for (const product of products) {
      const base = product.listedAt ?? product.createdAt;
      const nextUntil = new Date(base.getTime() + AD_ACTIVE_MS);
      if (nextUntil.getTime() <= now.getTime()) continue;

      await this.prisma.product.updateMany({
        where: { id: product.id, advertiser: 'CLIENT', status: 'DEPRECATED' },
        data: {
          status: 'ACTIVE',
          activeUntil: nextUntil,
          deprecatedAt: null,
        },
      });
      restored += 1;
    }

    return restored;
  }

  /**
   * Recompute CLIENT activeUntil from listedAt (fallback createdAt) so the
   * lifetime policy (AD_ACTIVE_DAYS) applies to existing listings.
   */
  async syncClientActiveUntilFromListedAt(): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: {
        advertiser: 'CLIENT',
        status: 'ACTIVE',
      },
      select: { id: true, listedAt: true, createdAt: true, activeUntil: true },
    });

    let updated = 0;
    for (const product of products) {
      const base = product.listedAt ?? product.createdAt;
      const nextUntil = new Date(base.getTime() + AD_ACTIVE_MS);
      const currentMs = product.activeUntil?.getTime() ?? null;
      if (currentMs === nextUntil.getTime()) continue;

      await this.prisma.product.updateMany({
        where: { id: product.id },
        data: { activeUntil: nextUntil },
      });
      updated += 1;
    }

    return updated;
  }

  async purgeExpiredListingPaymentDrafts(): Promise<number> {
    const result = await this.prisma.product.deleteMany({
      where: {
        advertiser: 'CLIENT',
        status: 'PENDING',
        listingFeePaid: false,
        listingPaymentDueAt: { lte: new Date() },
        orderItems: { none: {} },
      },
    });
    return result.count;
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
      // updateMany avoids RETURNING columns that may not exist yet if migrate is pending.
      await this.prisma.product.updateMany({
        where: { id: product.id, advertiser: 'CLIENT' },
        data: { status: 'DEPRECATED', deprecatedAt: now },
      });

      if (product.userId) {
        await this.messagesService.sendNotificationToUser(
          product.userId,
          'آگهی شما منقضی شد',
          `آگهی «${product.title}» پس از ${AD_ACTIVE_DAYS} روز منقضی شده است. تا ${DEPRECATED_DELETE_DAYS} روز دیگر در صورت عدم فعال‌سازی مجدد، به‌طور کامل حذف خواهد شد. از بخش «آگهی‌های من» می‌توانید آن را دوباره فعال کنید.`,
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
        orderItems: { none: {} },
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
