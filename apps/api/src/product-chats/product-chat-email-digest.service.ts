import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

const DIGEST_CHECK_INTERVAL_MS = 15 * 60 * 1000;

@Injectable()
export class ProductChatEmailDigestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProductChatEmailDigestService.name);
  private readonly dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  private lastDigestDateKey: string | null = null;
  private startupTimeout: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    this.startupTimeout = setTimeout(() => void this.tick(), 45_000);
    this.interval = setInterval(() => void this.tick(), DIGEST_CHECK_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.startupTimeout) clearTimeout(this.startupTimeout);
    if (this.interval) clearInterval(this.interval);
  }

  private tehranClock(date: Date): { hour: number; dateKey: string } {
    const parts = this.dateFormatter.formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '0';
    const hour = Number(get('hour') === '24' ? '0' : get('hour'));
    const dateKey = `${get('year')}-${get('month')}-${get('day')}`;
    return { hour, dateKey };
  }

  private tehranMidnightUtc(year: number, month: number, day: number): Date {
    const utcMidnight = Date.UTC(year, month - 1, day);
    const parts = this.dateFormatter.formatToParts(new Date(utcMidnight));
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '0';
    const localAsUtc = Date.UTC(
      Number(get('year')),
      Number(get('month')) - 1,
      Number(get('day')),
      Number(get('hour') === '24' ? '0' : get('hour')),
    );
    return new Date(utcMidnight - (localAsUtc - utcMidnight));
  }

  private tehranDayRange(dateKey: string): { start: Date; end: Date } {
    const [year, month, day] = dateKey.split('-').map(Number);
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));

    return {
      start: this.tehranMidnightUtc(year, month, day),
      end: this.tehranMidnightUtc(
        nextDay.getUTCFullYear(),
        nextDay.getUTCMonth() + 1,
        nextDay.getUTCDate(),
      ),
    };
  }

  private async tick() {
    try {
      const { dateKey: todayKey } = this.tehranClock(new Date());
      const [year, month, day] = todayKey.split('-').map(Number);
      const previousDay = new Date(Date.UTC(year, month - 1, day - 1));
      const dateKey = [
        previousDay.getUTCFullYear(),
        String(previousDay.getUTCMonth() + 1).padStart(2, '0'),
        String(previousDay.getUTCDate()).padStart(2, '0'),
      ].join('-');
      if (this.lastDigestDateKey === dateKey) return;

      const sent = await this.sendDailyDigest(dateKey);
      if (sent) this.lastDigestDateKey = dateKey;
    } catch (error) {
      this.logger.error('Product chat email digest failed', error);
    }
  }

  private async sendDailyDigest(dateKey: string): Promise<boolean> {
    const { start, end } = this.tehranDayRange(dateKey);
    const messages = await this.prisma.productChatMessage.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: {
        senderId: true,
        conversation: {
          select: {
            buyerId: true,
            sellerId: true,
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const recipients = new Map<string, { name: string; email: string }>();
    for (const message of messages) {
      const recipient =
        message.senderId === message.conversation.buyerId
          ? message.conversation.seller
          : message.conversation.buyer;
      if (recipient.email) {
        recipients.set(recipient.id, { name: recipient.name, email: recipient.email });
      }
    }

    let allSent = true;
    for (const [userId, recipient] of recipients) {
      const claim = await this.prisma.productChatEmailDigest.createMany({
        data: [{ userId, dateKey }],
        skipDuplicates: true,
      });
      if (claim.count === 0) continue;

      try {
        const sent = await this.mailService.sendProductChatDailyDigest(
          recipient.email,
          recipient.name,
        );
        if (sent) continue;

        allSent = false;
        this.logger.warn(`No product chat digest email sent for user ${userId}`);
        await this.prisma.productChatEmailDigest.deleteMany({ where: { userId, dateKey } });
      } catch (error) {
        allSent = false;
        this.logger.error(`Product chat digest email failed for user ${userId}`, error);
        await this.prisma.productChatEmailDigest.deleteMany({ where: { userId, dateKey } });
      }
    }

    this.logger.log(`Product chat email digest for ${dateKey}: ${recipients.size} recipient(s)`);
    return allSent;
  }
}
