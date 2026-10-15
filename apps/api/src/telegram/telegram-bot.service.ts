import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  type TelegramMessage,
  TelegramService,
  type TelegramUpdate,
} from "./telegram.service";

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    @Inject("TELEGRAM_WEBHOOK_SECRET") private readonly webhookSecret: string,
    @Inject("TELEGRAM_CHANNEL_CHAT_ID") private readonly channelChatId: string,
  ) {}

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

  /** Private bot DM to the Telegram chat ID provided in the user's profile. */
  async sendPrivateMessage(userId: string, html: string): Promise<boolean> {
    if (!this.telegram.isConfigured()) return false;
    const [chatId] = await this.getChatIdsForUsers([userId]);
    if (!chatId) return false;
    return this.telegram.sendMessage(chatId, html);
  }

  async handleWebhook(update: TelegramUpdate, secret?: string) {
    if (this.webhookSecret && secret !== this.webhookSecret) {
      this.logger.warn("Telegram webhook rejected: invalid secret");
      return { ok: false };
    }

    if (update.message) await this.handleChannelTopicCommand(update.message);
    return { ok: true };
  }

  /** Reply with message_thread_id when admin sends /topicid inside a @jeeppo forum topic. */
  private async handleChannelTopicCommand(
    message: TelegramMessage,
  ): Promise<boolean> {
    if (!this.channelChatId || !message.text) return false;

    const normalized = message.text.trim().split(/\s+/)[0]?.split("@")[0];
    if (normalized !== "/topicid") return false;

    const resolvedChannelId = await this.telegram.resolveChatId(
      this.channelChatId,
    );
    if (String(message.chat.id) !== resolvedChannelId) return false;

    const threadId = message.message_thread_id;
    if (!threadId) {
      await this.telegram.sendMessage(
        resolvedChannelId,
        "این دستور را داخل یک تاپیک بفرستید (نه در صفحهٔ اصلی گروه).",
      );
      return true;
    }

    await this.telegram.sendMessageToTopic(
      resolvedChannelId,
      threadId,
      `✅ <b>message_thread_id این تاپیک:</b> <code>${threadId}</code>\n\nبرای اعلان‌ها در <code>apps/api/.env</code>:\n<code>TELEGRAM_TOPIC_NEWS=${threadId}</code>\n\nسایر تاپیک‌ها:\nTELEGRAM_TOPIC_STRENGTHENED / TELEGRAM_TOPIC_BOOST / TELEGRAM_TOPIC_GUARANTEE / TELEGRAM_TOPIC_BEST_PRICE / TELEGRAM_TOPIC_SHOP / TELEGRAM_TOPIC_AUCTION`,
    );

    this.logger.log(
      `Topic id reported for thread ${threadId} in ${resolvedChannelId}`,
    );
    return true;
  }
}
