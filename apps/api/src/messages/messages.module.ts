import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { PushModule } from '../push/push.module';
import { MessagesService } from './messages.service';

@Module({
  imports: [TelegramModule, PushModule],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
