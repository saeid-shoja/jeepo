import { forwardRef, Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { OrderReminderService } from './order-reminder.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  controllers: [OrdersController],
  providers: [OrdersService, OrderReminderService],
  exports: [OrdersService],
})
export class OrdersModule {}
