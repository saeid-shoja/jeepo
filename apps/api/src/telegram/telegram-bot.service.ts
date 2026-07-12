import { Inject, Injectable, Logger } from '@nestjs/common';
import { SITE_NAME_FA } from '@offroad/shared';
import { PrismaService } from '../prisma/prisma.service';
import { type TelegramMessage, TelegramService, type TelegramUpdate } from './telegram.service';

const LINK_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    @Inject('TELEGRAM_WEBHOOK_SECRET') private readonly webhookSecret: string,
    @Inject('TELEGRAM_CHANNEL_CHAT_ID') private readonly channelChatId: string,
  ) { }

  async createLinkForUser(userId: string) {
    if (!this.telegram.isConfigured()) {
      return {
        configured: false,
        linked: false,
        message: 'ربات تلگرام هنوز پیکربندی نشده است',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true, telegramLinkedAt: true },
    });
    if (!user) {
      return { configured: true, linked: false, message: 'کاربر یافت نشد' };
    }

    if (user.telegramChatId) {
      return {
        configured: true,
        linked: true,
        linkedAt: user.telegramLinkedAt,
        botUsername: this.telegram.getBotUsername(),
      };
    }

    const token = this.telegram.generateLinkToken();
    const expiresAt = new Date(Date.now() + LINK_TTL_MS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { telegramLinkToken: token, telegramLinkExpiresAt: expiresAt },
    });

    return {
      configured: true,
      linked: false,
      botUrl: this.telegram.buildDeepLink(token),
      botUsername: this.telegram.getBotUsername(),
      expiresAt,
    };
  }

  async getSubscriberCount(): Promise<number> {
    return this.prisma.user.count({
      where: { telegramChatId: { not: null } },
    });
  }

  async getStats() {
    const subscriberCount = await this.getSubscriberCount();
    const configured = this.telegram.isConfigured();
    return {
      configured,
      subscriberCount,
      botUsername: configured ? this.telegram.getBotUsername() : null,
    };
  }

  async getChatIdsForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, telegramChatId: { not: null } },
      select: { telegramChatId: true },
    });
    return users.map((u) => u.telegramChatId!).filter(Boolean);
  }

  async getAllSubscriberChatIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { telegramChatId: { not: null } },
      select: { telegramChatId: true },
    });
    return users.map((u) => u.telegramChatId!).filter(Boolean);
  }

  async handleWebhook(update: TelegramUpdate, secret?: string) {
    if (this.webhookSecret && secret !== this.webhookSecret) {
      this.logger.warn('Telegram webhook rejected: invalid secret');
      return { ok: false };
    }

    const message = update.message;
    if (!message?.chat?.id) {
      return { ok: true };
    }

    if (await this.handleChannelTopicCommand(message)) {
      return { ok: true };
    }

    if (!message.text) {
      return { ok: true };
    }

    const payload = this.telegram.parseStartPayload(message.text);
    if (payload == null) {
      if (message.text.startsWith('/start')) {
        await this.telegram.sendMessage(
          String(message.chat.id),
          `سلام! برای دریافت اطلاعیه‌های ${SITE_NAME_FA}، ابتدا از پنل کاربری سایت دکمه «اتصال تلگرام» را بزنید و سپس لینک را باز کنید.`,
        );
      }
      return { ok: true };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        telegramLinkToken: payload,
        telegramLinkExpiresAt: { gt: new Date() },
      },
      select: { id: true, name: true, telegramChatId: true },
    });

    const chatId = String(message.chat.id);

    if (!user) {
      await this.telegram.sendMessage(
        chatId,
        'لینک اتصال نامعتبر یا منقضی شده است. از پنل کاربری سایت دوباره «اتصال تلگرام» را بزنید.',
      );
      return { ok: true };
    }

    if (user.telegramChatId && user.telegramChatId !== chatId) {
      await this.telegram.sendMessage(chatId, 'این حساب کاربری قبلاً به تلگرام دیگری متصل شده است.');
      return { ok: true };
    }

    const existing = await this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
      select: { id: true },
    });
    if (existing && existing.id !== user.id) {
      await this.telegram.sendMessage(
        chatId,
        'این حساب تلگرام قبلاً به کاربر دیگری در سایت متصل شده است.',
      );
      return { ok: true };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: chatId,
        telegramLinkedAt: new Date(),
        telegramLinkToken: null,
        telegramLinkExpiresAt: null,
      },
    });

    await this.telegram.sendMessage(
      chatId,
      `✅ اتصال با موفقیت انجام شد.\n\nاز این پس اطلاعیه‌ها و اخبار ${SITE_NAME_FA} را اینجا دریافت می‌کنید.`,
    );

    return { ok: true };
  }

  /** Reply with message_thread_id when admin sends /topicid inside a @jeeppo forum topic. */
  private async handleChannelTopicCommand(message: TelegramMessage): Promise<boolean> {
    if (!this.channelChatId || !message.text) return false;

    const normalized = message.text.trim().split(/\s+/)[0]?.split('@')[0];
    if (normalized !== '/topicid') return false;

    const resolvedChannelId = await this.telegram.resolveChatId(this.channelChatId);
    if (String(message.chat.id) !== resolvedChannelId) return false;

    const threadId = message.message_thread_id;
    if (!threadId) {
      await this.telegram.sendMessage(
        resolvedChannelId,
        'این دستور را داخل یک تاپیک بفرستید (نه در صفحهٔ اصلی گروه).',
      );
      return true;
    }

    await this.telegram.sendMessageToTopic(
      resolvedChannelId,
      threadId,
      `✅ <b>message_thread_id این تاپیک:</b> <code>${threadId}</code>\n\nبرای اعلان‌ها در <code>apps/api/.env</code>:\n<code>TELEGRAM_TOPIC_NEWS=${threadId}</code>\n\nسایر تاپیک‌ها:\nTELEGRAM_TOPIC_STRENGTHENED / TELEGRAM_TOPIC_BOOST / TELEGRAM_TOPIC_GUARANTEE / TELEGRAM_TOPIC_SHOP / TELEGRAM_TOPIC_AUCTION`,
    );

    this.logger.log(`Topic id reported for thread ${threadId} in ${resolvedChannelId}`);
    return true;
  }
}
