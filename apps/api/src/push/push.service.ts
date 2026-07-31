import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import type { PushSubscribeDto } from './dto/push-subscribe.dto';

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;
  private publicKey: string | null = null;

  constructor(
    private prisma: PrismaService,
    vapidPublicKey: string,
    vapidPrivateKey: string,
    vapidSubject: string,
  ) {
    const publicKey = vapidPublicKey?.trim();
    const privateKey = vapidPrivateKey?.trim();
    const subject = vapidSubject?.trim() || 'mailto:jeepoinfo@gmail.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
      this.publicKey = publicKey;
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  getConfig() {
    return {
      enabled: this.configured,
      publicKey: this.publicKey,
    };
  }

  async subscribe(userId: string, dto: PushSubscribeDto, userAgent?: string) {
    await this.prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId, endpoint: dto.endpoint },
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent,
      },
    });
    return { subscribed: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { unsubscribed: true };
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!this.configured) return { sent: 0, failed: 0 };

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const result = await this.sendOne(sub, payload);
      if (result === 'sent') sent++;
      else failed++;
    }

    return { sent, failed };
  }

  async sendToUsers(userIds: string[], payload: PushPayload) {
    if (!this.configured || userIds.length === 0) return { sent: 0, failed: 0 };

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });
    if (subscriptions.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const result = await this.sendOne(sub, payload);
      if (result === 'sent') sent++;
      else failed++;
    }

    return { sent, failed };
  }

  private async sendOne(
    sub: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: PushPayload,
  ): Promise<'sent' | 'failed'> {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? '/',
          tag: payload.tag,
        }),
      );
      return 'sent';
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
      this.logger.warn(`Push failed for subscription ${sub.id}: ${String(error)}`);
      return 'failed';
    }
  }
}
