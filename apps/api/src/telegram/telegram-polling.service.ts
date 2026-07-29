import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';

/**
 * Long-polling for local/dev when Telegram cannot reach localhost webhooks.
 * Enable with TELEGRAM_USE_POLLING=true (do not use on production with a live webhook).
 */
@Injectable()
export class TelegramPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPollingService.name);
  private stopped = false;
  private offset = 0;
  private loop?: Promise<void>;

  constructor(
    private readonly telegram: TelegramService,
    private readonly telegramBot: TelegramBotService,
    @Inject('TELEGRAM_USE_POLLING') private readonly usePolling: boolean,
  ) {}

  onModuleInit() {
    if (!this.usePolling) return;
    if (!this.telegram.isConfigured()) {
      this.logger.warn('TELEGRAM_USE_POLLING=true but bot token/username missing');
      return;
    }
    this.loop = this.runLoop();
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  private async runLoop() {
    const info = await this.telegram.getWebhookInfo();
    if (info?.url) {
      this.logger.warn(
        `Deleting existing Telegram webhook (${info.url}) so local polling can receive updates`,
      );
      await this.telegram.deleteWebhook();
    }

    this.logger.log(
      'Telegram polling active — send the link code to the bot; you should see logs here.',
    );

    while (!this.stopped) {
      try {
        const updates = await this.telegram.getUpdates(this.offset, 25);
        for (const update of updates) {
          this.offset = update.update_id + 1;
          await this.telegramBot.processUpdate(update);
        }
      } catch (err) {
        this.logger.warn(
          `Telegram polling error: ${err instanceof Error ? err.message : String(err)}`,
        );
        await sleep(2000);
      }
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
