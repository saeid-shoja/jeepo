import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module';
import { TelegramModule } from '../telegram/telegram.module';
import { ProductChatEmailDigestService } from './product-chat-email-digest.service';
import { ProductChatsController } from './product-chats.controller';
import { ProductChatsService } from './product-chats.service';

@Module({
  imports: [PushModule, TelegramModule],
  controllers: [ProductChatsController],
  providers: [ProductChatsService, ProductChatEmailDigestService],
  exports: [ProductChatsService],
})
export class ProductChatsModule {}
