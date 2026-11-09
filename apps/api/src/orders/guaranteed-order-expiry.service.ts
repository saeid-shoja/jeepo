import { Injectable, Logger, type OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OrdersService } from './orders.service';

const EXPIRY_CHECK_INTERVAL_MS = 60 * 1000;

@Injectable()
export class GuaranteedOrderExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GuaranteedOrderExpiryService.name);
  private interval: NodeJS.Timeout | null = null;
  private initialCheck: NodeJS.Timeout | null = null;

  constructor(private readonly ordersService: OrdersService) {}

  onModuleInit() {
    this.initialCheck = setTimeout(() => void this.tick(), 30_000);
    this.interval = setInterval(() => void this.tick(), EXPIRY_CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.initialCheck) clearTimeout(this.initialCheck);
  }

  private async tick() {
    try {
      const expired = await this.ordersService.expireOverdueGuaranteedItems();
      if (expired) {
        this.logger.log(`Automatically cancelled ${expired} expired guaranteed order item(s)`);
      }
    } catch (error) {
      this.logger.error('Guaranteed order expiry check failed', error);
    }
  }
}
