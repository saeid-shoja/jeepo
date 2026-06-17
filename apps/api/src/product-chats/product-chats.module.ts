import { Module } from '@nestjs/common';
import { ProductChatsController } from './product-chats.controller';
import { ProductChatsService } from './product-chats.service';

@Module({
  controllers: [ProductChatsController],
  providers: [ProductChatsService],
  exports: [ProductChatsService],
})
export class ProductChatsModule {}
