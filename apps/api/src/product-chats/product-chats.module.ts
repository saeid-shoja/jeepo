import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module';
import { ProductChatsController } from './product-chats.controller';
import { ProductChatsService } from './product-chats.service';

@Module({
  imports: [PushModule],
  controllers: [ProductChatsController],
  providers: [ProductChatsService],
  exports: [ProductChatsService],
})
export class ProductChatsModule {}
