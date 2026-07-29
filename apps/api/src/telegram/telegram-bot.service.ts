import { Inject, Injectable, Logger } from '@nestjs/common';
import { SITE_NAME_FA } from '@offroad/shared';
import { PrismaService } from '../prisma/prisma.service';
import { type TelegramMessage, TelegramService, type TelegramUpdate } from './telegram.service';

/** Link codes stay valid this long; reused until expiry so status checks don't break them. */
const LINK_TTL_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    @Inject('TELEGRAM_WEBHOOK_SECRET') private readonly webhookSecret: string,
    @Inject('TELEGRAM_CHANNEL_CHAT_ID') private readonly channelChatId: string,
  ) {}

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
      select: {
        telegramChatId: true,
        telegramLinkedAt: true,
        telegramLinkToken: true,
        telegramLinkExpiresAt: true,
      },
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

    const now = new Date();
    const existingCode = this.telegram.normalizeLinkCode(user.telegramLinkToken);
    const hasValidCode =
      Boolean(existingCode) &&
      Boolean(user.telegramLinkExpiresAt) &&
      user.telegramLinkExpiresAt! > now &&
      // Prefer short codes; remint legacy hex tokens so UI can show a copyable code
      existingCode!.length === 6;

    let linkCode = existingCode!;
    let expiresAt = user.telegramLinkExpiresAt!;

    if (!hasValidCode) {
      linkCode = await this.mintUniqueLinkCode();
      expiresAt = new Date(now.getTime() + LINK_TTL_MS);
      await this.prisma.user.update({
        where: { id: userId },
        data: { telegramLinkToken: linkCode, telegramLinkExpiresAt: expiresAt },
      });
    }

    return {
      configured: true,
      linked: false,
      linkCode,
      botUrl: this.telegram.buildBotUrl(),
      botUsername: this.telegram.getBotUsername(),
      expiresAt,
    };
  }

  private async mintUniqueLinkCode(): Promise<string> {
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = this.telegram.generateLinkToken();
      const clash = await this.prisma.user.findFirst({
        where: {
          telegramLinkToken: code,
          telegramLinkExpiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      if (!clash) return code;
    }
    // Extremely unlikely; fall back to timestamp suffix within alphabet length
    return `${this.telegram.generateLinkToken().slice(0, 4)}${String(Date.now()).slice(-2)}`;
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

    return this.processUpdate(update);
  }

  /** Process an update from webhook or local polling (no secret check). */
  async processUpdate(update: TelegramUpdate) {
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

    this.logger.log(`Telegram message from chat ${message.chat.id}: ${message.text.slice(0, 80)}`);

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const startPayload = this.telegram.parseStartPayload(text);
    const linkCode =
      this.telegram.normalizeLinkCode(startPayload) ??
      (startPayload == null ? this.telegram.normalizeLinkCode(text) : null);

    if (linkCode) {
      await this.linkChatWithCode(chatId, linkCode);
      return { ok: true };
    }

    if (text.startsWith('/start')) {
      const alreadyLinked = await this.prisma.user.findUnique({
        where: { telegramChatId: chatId },
        select: { id: true },
      });
      if (alreadyLinked) {
        await this.telegram.sendMessage(
          chatId,
          `✅ حساب شما قبلاً به ${SITE_NAME_FA} متصل است.\n\nاطلاعیه‌ها و اخبار را همین‌جا دریافت می‌کنید.`,
        );
      } else {
        await this.telegram.sendMessage(
          chatId,
          [
            `سلام! برای اتصال به ${SITE_NAME_FA}:`,
            '',
            '۱. در پنل کاربری سایت، کد ۶ حرفی اتصال را کپی کنید',
            '۲. همان کد را همین‌جا بفرستید',
            '',
            'مثال: <code>A7K2M9</code>',
          ].join('\n'),
        );
      }
      return { ok: true };
    }

    // Ignore unrelated chat messages so we don't spam users
    return { ok: true };
  }

  private async linkChatWithCode(chatId: string, linkCode: string) {
    const alreadyLinked = await this.prisma.user.findUnique({
      where: { telegramChatId: chatId },
      select: { id: true },
    });
    if (alreadyLinked) {
      await this.telegram.sendMessage(
        chatId,
        `✅ این تلگرام از قبل به حساب ${SITE_NAME_FA} متصل است. کار دیگری لازم نیست.`,
      );
      return;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        telegramLinkToken: linkCode,
        telegramLinkExpiresAt: { gt: new Date() },
      },
      select: { id: true, telegramChatId: true },
    });

    if (!user) {
      const expired = await this.prisma.user.findFirst({
        where: { telegramLinkToken: linkCode },
        select: { id: true },
      });
      await this.telegram.sendMessage(
        chatId,
        expired
          ? [
              '⏱ این کد منقضی شده است.',
              '',
              'به پنل کاربری سایت برگردید تا کد تازه ببینید، سپس همان کد را اینجا بفرستید.',
            ].join('\n')
          : [
              '❌ کد اتصال نامعتبر است.',
              '',
              'کد ۶ حرفی را از پنل کاربری سایت کپی کنید و دقیقاً همین‌جا بفرستید (بدون فاصله یا متن اضافه).',
            ].join('\n'),
      );
      return;
    }

    if (user.telegramChatId && user.telegramChatId !== chatId) {
      await this.telegram.sendMessage(
        chatId,
        'این حساب کاربری قبلاً به یک تلگرام دیگر متصل شده است. اگر دسترسی ندارید، از پشتیبانی سایت کمک بگیرید.',
      );
      return;
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
      return;
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
      `✅ اتصال با موفقیت انجام شد.\n\nاز این پس اطلاعیه‌ها و اخبار ${SITE_NAME_FA} را اینجا دریافت می‌کنید.\nمی‌توانید به پنل کاربری سایت برگردید و وضعیت را ببینید.`,
    );
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
      `✅ <b>message_thread_id این تاپیک:</b> <code>${threadId}</code>\n\nبرای اعلان‌ها در <code>apps/api/.env</code>:\n<code>TELEGRAM_TOPIC_NEWS=${threadId}</code>\n\nسایر تاپیک‌ها:\nTELEGRAM_TOPIC_STRENGTHENED / TELEGRAM_TOPIC_BOOST / TELEGRAM_TOPIC_GUARANTEE / TELEGRAM_TOPIC_BEST_PRICE / TELEGRAM_TOPIC_SHOP / TELEGRAM_TOPIC_AUCTION`,
    );

    this.logger.log(`Topic id reported for thread ${threadId} in ${resolvedChannelId}`);
    return true;
  }
}
