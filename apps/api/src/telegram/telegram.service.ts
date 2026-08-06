import { randomBytes } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';

const TELEGRAM_API = 'https://api.telegram.org';

export type TelegramMessage = {
  message_id: number;
  chat: { id: number; type: string; username?: string };
  text?: string;
  message_thread_id?: number;
  from?: { id: number; username?: string; first_name?: string };
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @Inject('TELEGRAM_BOT_TOKEN') private readonly botToken: string,
    @Inject('TELEGRAM_BOT_USERNAME') private readonly botUsername: string,
  ) { }

  isConfigured(): boolean {
    return Boolean(this.botToken && this.botUsername);
  }

  getBotUsername(): string {
    return this.botUsername.replace(/^@/, '');
  }

  /** Open chat with bot (no deep-link payload — more reliable on mobile). */
  buildBotUrl(): string {
    return `https://t.me/${this.getBotUsername()}`;
  }

  buildDeepLink(token: string): string {
    return `https://t.me/${this.getBotUsername()}?start=${encodeURIComponent(token)}`;
  }

  /** Short human-friendly link code (avoids fragile Telegram deep-link payloads). */
  generateLinkToken(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += alphabet[bytes[i]! % alphabet.length];
    }
    return code;
  }

  normalizeLinkCode(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const code = raw.trim().toUpperCase().replace(/[\s-]/g, '');
    if (/^[A-Z0-9]{6}$/.test(code)) return code;
    // Legacy hex deep-link tokens (32 chars)
    const hex = raw.trim().toLowerCase();
    if (/^[a-f0-9]{32}$/.test(hex)) return hex;
    return null;
  }

  private async callApi<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
    if (!this.botToken) {
      this.logger.warn(`Telegram skipped (${method}): TELEGRAM_BOT_TOKEN missing`);
      return null;
    }
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { ok: boolean; description?: string; result?: T };
      if (!data.ok) {
        this.logger.warn(
          `Telegram ${method} failed: ${data.description ?? res.status}${formatApiContext(body)}`,
        );
        return null;
      }

      return data.result ?? null;
    }
    catch (error) {
      this.logger.error(
        `Telegram ${method} network error: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  async getWebhookInfo(): Promise<{
    url?: string;
    pending_update_count?: number;
    last_error_message?: string;
  } | null> {
    return this.callApi('getWebhookInfo', {});
  }

  async deleteWebhook(): Promise<boolean> {
    const result = await this.callApi('deleteWebhook', { drop_pending_updates: false });
    return result != null;
  }

  async getUpdates(offset: number, timeoutSec = 25): Promise<TelegramUpdate[]> {
    if (!this.botToken) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (timeoutSec + 5) * 1000);

    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/getUpdates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offset,
          timeout: timeoutSec,
          allowed_updates: ['message'],
        }),
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        ok: boolean;
        description?: string;
        result?: TelegramUpdate[];
      };
      if (!data.ok) {
        this.logger.warn(`Telegram getUpdates failed: ${data.description ?? res.status}`);
        return [];
      }
      return data.result ?? [];
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return [];
      this.logger.warn(`Telegram getUpdates error: ${err instanceof Error ? err.message : err}`);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    const resolvedChatId = await this.resolveChatId(chatId);
    const result = await this.callApi('sendMessage', {
      chat_id: resolvedChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    return result != null;
  }

  /** Resolve @username to numeric chat id (required for forum topic posts). */
  async resolveChatId(chatIdOrUsername: string): Promise<string> {
    const trimmed = chatIdOrUsername.trim();
    if (/^-?\d+$/.test(trimmed)) return trimmed;

    const cached = this.resolvedChatIds.get(trimmed);
    if (cached) return cached;

    const chat = await this.callApi<{ id: number; is_forum?: boolean; title?: string }>('getChat', {
      chat_id: trimmed,
    });
    if (!chat) return trimmed;

    const numericId = String(chat.id);
    this.resolvedChatIds.set(trimmed, numericId);
    this.logger.log(
      `Telegram chat resolved: ${trimmed} → ${numericId}${chat.is_forum ? ' (forum)' : ''}`,
    );
    return numericId;
  }

  private readonly resolvedChatIds = new Map<string, string>();

  async sendMessageToTopic(
    chatId: string,
    topicAnchorMessageId: number,
    text: string,
    options?: { disableWebPagePreview?: boolean },
  ): Promise<boolean> {
    const resolvedChatId = await this.resolveChatId(chatId);
    const preview = options?.disableWebPagePreview ?? true;

    // t.me/jeeppo/{id} → message_id for reply; Telegram routes to the correct forum topic.
    const withReply = await this.callApi('sendMessage', {
      chat_id: resolvedChatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: preview,
      reply_parameters: { message_id: topicAnchorMessageId },
    });
    if (withReply) return true;

    const withThread = await this.callApi('sendMessage', {
      chat_id: resolvedChatId,
      message_thread_id: topicAnchorMessageId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: preview,
    });
    return withThread != null;
  }

  async sendPhotoToTopic(
    chatId: string,
    topicAnchorMessageId: number,
    photo: string,
    caption: string,
  ): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('Telegram skipped (sendPhoto): TELEGRAM_BOT_TOKEN missing');
      return false;
    }

    const resolvedChatId = await this.resolveChatId(chatId);
    const replyParams = JSON.stringify({ message_id: topicAnchorMessageId });

    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      const withReply = await this.callApi('sendPhoto', {
        chat_id: resolvedChatId,
        photo,
        caption,
        parse_mode: 'HTML',
        reply_parameters: { message_id: topicAnchorMessageId },
      });
      if (withReply) return true;

      const withThread = await this.callApi('sendPhoto', {
        chat_id: resolvedChatId,
        message_thread_id: topicAnchorMessageId,
        photo,
        caption,
        parse_mode: 'HTML',
      });
      return withThread != null;
    }

    const image = parseImageBuffer(photo);
    if (!image) {
      return this.sendMessageToTopic(chatId, topicAnchorMessageId, caption);
    }

    const form = new FormData();
    form.append('chat_id', resolvedChatId);
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    form.append('reply_parameters', replyParams);
    form.append('photo', new Blob([new Uint8Array(image)], { type: 'image/jpeg' }), 'photo.jpg');

    try {
      let res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/sendPhoto`, {
        method: 'POST',
        body: form,
      });
      let data = (await res.json()) as { ok: boolean; description?: string };
      if (data.ok) return true;

      const formThread = new FormData();
      formThread.append('chat_id', resolvedChatId);
      formThread.append('message_thread_id', String(topicAnchorMessageId));
      formThread.append('caption', caption);
      formThread.append('parse_mode', 'HTML');
      formThread.append(
        'photo',
        new Blob([new Uint8Array(image)], { type: 'image/jpeg' }),
        'photo.jpg',
      );

      res = await fetch(`${TELEGRAM_API}/bot${this.botToken}/sendPhoto`, {
        method: 'POST',
        body: formThread,
      });
      data = (await res.json()) as { ok: boolean; description?: string };
      if (!data.ok) {
        this.logger.warn(`Telegram sendPhoto failed: ${data.description ?? res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`Telegram sendPhoto error: ${err instanceof Error ? err.message : err}`);
      return false;
    }
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

function parseImageBuffer(photo: string): Buffer | null {
  const dataUrlMatch = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(photo.trim());
  if (dataUrlMatch) {
    try {
      return Buffer.from(dataUrlMatch[1], 'base64');
    } catch {
      return null;
    }
  }
  if (/^[A-Za-z0-9+/=]+$/.test(photo.trim()) && photo.length > 100) {
    try {
      return Buffer.from(photo.trim(), 'base64');
    } catch {
      return null;
    }
  }
  return null;
}

export { escapeTelegramHtml };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatApiContext(body: Record<string, unknown>): string {
  const chatId = body.chat_id;
  const threadId = body.message_thread_id;
  const replyParams = body.reply_parameters as { message_id?: number } | undefined;
  if (chatId == null && threadId == null && replyParams?.message_id == null) return '';
  const parts: string[] = [];
  if (chatId != null) parts.push(`chat_id=${chatId}`);
  if (replyParams?.message_id != null) parts.push(`reply_to=${replyParams.message_id}`);
  if (threadId != null) parts.push(`message_thread_id=${threadId}`);
  return ` (${parts.join(', ')})`;
}
