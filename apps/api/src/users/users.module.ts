import { Module } from '@nestjs/common';
import { FavoritesModule } from '../favorites/favorites.module';
import { MessagesModule } from '../messages/messages.module';
import { ProductsModule } from '../products/products.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [ProductsModule, MessagesModule, FavoritesModule, TelegramModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
