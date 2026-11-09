import { forwardRef, Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { GuaranteedOrderExpiryService } from './guaranteed-order-expiry.service';
import { OrderReminderService } from './order-reminder.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [forwardRef(() => PaymentsModule)],
  controllers: [OrdersController],
  providers: [OrdersService, OrderReminderService, GuaranteedOrderExpiryService],
  exports: [OrdersService],
})
export class OrdersModule {}
