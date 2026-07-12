import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramChannelService } from './telegram-channel.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, TelegramBotService, TelegramChannelService],
  exports: [TelegramService, TelegramBotService, TelegramChannelService],
})
export class TelegramModule { }
