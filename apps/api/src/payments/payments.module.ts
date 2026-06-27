import { forwardRef, Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ZibalService } from './zibal.service';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  controllers: [PaymentsController],
  providers: [ZibalService, PaymentsService],
  exports: [PaymentsService, ZibalService],
})
export class PaymentsModule {}
