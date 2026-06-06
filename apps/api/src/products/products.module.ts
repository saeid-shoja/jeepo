import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { MessagesModule } from '../messages/messages.module';
import { ProductLifecycleService } from './product-lifecycle.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [CategoriesModule, MessagesModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductLifecycleService],
  exports: [ProductsService, ProductLifecycleService],
})
export class ProductsModule {}
