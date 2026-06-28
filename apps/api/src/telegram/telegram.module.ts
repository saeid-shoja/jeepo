import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, TelegramBotService],
  exports: [TelegramService, TelegramBotService],
})
export class TelegramModule {}
