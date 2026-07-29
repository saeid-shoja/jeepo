import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramChannelService } from './telegram-channel.service';
import { TelegramPollingService } from './telegram-polling.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, TelegramBotService, TelegramChannelService, TelegramPollingService],
  exports: [TelegramService, TelegramBotService, TelegramChannelService],
})
export class TelegramModule {}
