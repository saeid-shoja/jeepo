import { forwardRef, Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ZibalService } from './zibal.service';

@Module({
  imports: [forwardRef(() => OrdersModule), forwardRef(() => ProductsModule)],
  controllers: [PaymentsController],
  providers: [ZibalService, PaymentsService],
  exports: [PaymentsService, ZibalService],
})
export class PaymentsModule {}
