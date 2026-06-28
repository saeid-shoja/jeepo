import { Module } from '@nestjs/common';
import { MessagesModule } from '../messages/messages.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ProductsModule, OrdersModule, MessagesModule, TelegramModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
