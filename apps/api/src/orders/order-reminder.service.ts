import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getOrderStatusLabel } from '@offroad/shared';
import { MailService } from '../mail/mail.service';
import { OrdersService } from './orders.service';

/** Check every 15 minutes; send once when Tehran local hour hits 20. */
const DIGEST_CHECK_INTERVAL_MS = 15 * 60 * 1000;
const DIGEST_HOUR_TEHRAN = 20;

@Injectable()
export class OrderReminderService implements OnModuleInit {
  private readonly logger = new Logger(OrderReminderService.name);
  private lastDigestDateKey: string | null = null;

  constructor(
    private ordersService: OrdersService,
    private mailService: MailService,
  ) {}

  onModuleInit() {
    setTimeout(() => void this.tick(), 45_000);
    setInterval(() => void this.tick(), DIGEST_CHECK_INTERVAL_MS);
  }

  private async tick() {
    try {
      const { hour, dateKey } = this.tehranClock();
      if (hour !== DIGEST_HOUR_TEHRAN) return;
      if (this.lastDigestDateKey === dateKey) return;

      await this.sendDailyDigest();
      this.lastDigestDateKey = dateKey;
    } catch (error) {
      this.logger.error('Order reminder tick failed', error);
    }
  }

  /** Tehran (Asia/Tehran) wall-clock hour and YYYY-MM-DD key. */
  private tehranClock(): { hour: number; dateKey: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
    const hour = Number(get('hour') === '24' ? '0' : get('hour'));
    const dateKey = `${get('year')}-${get('month')}-${get('day')}`;
    return { hour, dateKey };
  }

  async sendDailyDigest() {
    const orders = await this.ordersService.findOrdersNeedingAttention();
    if (orders.length === 0) {
      this.logger.log('Order digest: no open orders needing attention');
      return;
    }

    const rows = orders.map((o) => ({
      id: o.id,
      status: o.status,
      statusLabel: getOrderStatusLabel(o.status),
      total: o.total,
      buyerName: o.user?.name ?? '—',
      createdAt: o.createdAt,
      statusChangedAt: o.statusChangedAt,
      itemCount: o.items.length,
    }));

    const recipients = await this.ordersService.listAdminNotificationEmails();
    this.logger.log(
      `Order digest: sending ${rows.length} open order(s) to ${recipients.length} recipient(s)`,
    );

    await Promise.all(
      recipients.map((email) =>
        this.mailService.sendAdminOrdersDigest(email, rows).catch((err) => {
          this.logger.warn(`Order digest to ${email} failed: ${String(err)}`);
        }),
      ),
    );
  }
}
