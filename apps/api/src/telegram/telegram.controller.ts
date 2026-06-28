import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/custom.decorator';
import type { TelegramUpdate } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  @Public()
  @Post('webhook')
  handleWebhook(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ) {
    return this.telegramBotService.handleWebhook(update, secret);
  }
}
