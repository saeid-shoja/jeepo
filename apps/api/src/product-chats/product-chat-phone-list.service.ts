import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FINALIZE_INTERVAL_MS = 60 * 1000;

@Injectable()
export class ProductChatPhoneListService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductChatPhoneListService.name);
  private readonly tehranDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  private startupTimeout: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private finalizing = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.startupTimeout = setTimeout(() => void this.finalizePastDays(), 45_000);
    this.interval = setInterval(() => void this.finalizePastDays(), FINALIZE_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.startupTimeout) clearTimeout(this.startupTimeout);
    if (this.interval) clearInterval(this.interval);
  }

  getTehranDateKey(date: Date): string {
    const parts = this.tehranDateFormatter.formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '0';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  async listDays() {
    const todayKey = this.getTehranDateKey(new Date());
    const entries = await this.prisma.productChatRecipientPhone.findMany({
      where: { dateKey: { lte: todayKey } },
      select: { dateKey: true, phone: true },
      orderBy: [{ dateKey: 'desc' }, { phone: 'asc' }],
    });

    const days = new Map<string, string[]>();
    for (const entry of entries) {
      const phones = days.get(entry.dateKey) ?? [];
      phones.push(entry.phone);
      days.set(entry.dateKey, phones);
    }

    if (!days.has(todayKey)) days.set(todayKey, []);

    return Array.from(days, ([dateKey, phones]) => ({
      dateKey,
      phones,
      phoneCount: phones.length,
      isOpen: dateKey === todayKey,
    }));
  }

  async deleteFinalizedDay(dateKey: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new BadRequestException('تاریخ فهرست نامعتبر است');
    }

    const todayKey = this.getTehranDateKey(new Date());
    const result = await this.prisma.productChatRecipientPhone.deleteMany({
      where: { dateKey, AND: [{ dateKey: { lte: todayKey } }] },
    });
    return { dateKey, deletedCount: result.count };
  }

  private async finalizePastDays() {
    if (this.finalizing) return;
    this.finalizing = true;
    try {
      const todayKey = this.getTehranDateKey(new Date());
      const result = await this.prisma.productChatRecipientPhone.updateMany({
        where: { dateKey: { lt: todayKey }, finalizedAt: null },
        data: { finalizedAt: new Date() },
      });
      if (result.count > 0) {
        this.logger.log(`Finalized ${result.count} product chat recipient phone(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to finalize product chat recipient phone lists', error);
    } finally {
      this.finalizing = false;
    }
  }
}
