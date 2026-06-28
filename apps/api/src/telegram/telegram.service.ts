import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';

const TELEGRAM_API = 'https://api.telegram.org';

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    text?: string;
    from?: { id: number; username?: string; first_name?: string };
  };
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @Inject('TELEGRAM_BOT_TOKEN') private readonly botToken: string,
    @Inject('TELEGRAM_BOT_USERNAME') private readonly botUsername: string,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.botToken && this.botUsername);
  }

  getBotUsername(): string {
    return this.botUsername;
  }

  buildDeepLink(token: string): string {
    return `https://t.me/${this.botUsername}?start=${encodeURIComponent(token)}`;
  }

  generateLinkToken(): string {
    return randomBytes(16).toString('hex');
  }

  private async callApi<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
    if (!this.botToken) {
      this.logger.warn(`Telegram skipped (${method}): TELEGRAM_BOT_TOKEN missing`);
      return null;
    }

    const res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { ok: boolean; description?: string; result?: T };
    if (!data.ok) {
      this.logger.warn(`Telegram ${method} failed: ${data.description ?? res.status}`);
      return null;
    }

    return data.result ?? null;
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    const result = await this.callApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    return result != null;
  }

  async broadcast(
    chatIds: string[],
    title: string,
    body: string,
  ): Promise<{ sent: number; failed: number }> {
    if (chatIds.length === 0) return { sent: 0, failed: 0 };

    const text = `<b>${escapeTelegramHtml(title)}</b>\n\n${escapeTelegramHtml(body)}`;
    let sent = 0;
    let failed = 0;

    for (const chatId of chatIds) {
      const ok = await this.sendMessage(chatId, text);
      if (ok) sent++;
      else failed++;
      // Respect Telegram rate limits (~30 msg/s); small delay is enough for admin broadcasts.
      await sleep(50);
    }

    return { sent, failed };
  }

  parseStartPayload(text: string | undefined): string | null {
    if (!text) return null;
    const match = /^\/start(?:@\w+)?(?:\s+(.+))?$/i.exec(text.trim());
    return match?.[1]?.trim() || null;
  }
}

function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
