import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SITE_NAME_FA } from '@offroad/shared';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { tomanToRial, ZibalService } from './zibal.service';

const ZIBAL_SUCCESS = 100;
const ZIBAL_ALREADY_VERIFIED = 201;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly zibal: ZibalService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    @Inject('ZIBAL_CALLBACK_URL') private readonly callbackUrl: string,
  ) {}

  async initiateForOrder(
    orderId: string,
    userId: string,
  ): Promise<{ paymentUrl: string; trackId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { phone: true } } },
    });

    if (!order) throw new NotFoundException('سفارش یافت نشد');
    if (order.userId !== userId) throw new BadRequestException('دسترسی به این سفارش مجاز نیست');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('این سفارش قبلاً پرداخت شده یا لغو شده است');
    }

    const amountRial = tomanToRial(order.total);
    if (amountRial < 1000) {
      throw new BadRequestException('مبلغ سفارش برای پرداخت آنلاین کافی نیست');
    }

    const response = await this.zibal.requestPayment({
      amount: amountRial,
      callbackUrl: this.callbackUrl,
      orderId: order.id,
      description: `سفارش ${SITE_NAME_FA} — ${order.id.slice(-8)}`,
      mobile: order.phone ?? order.user.phone,
    });

    if (response.result !== ZIBAL_SUCCESS || !response.trackId) {
      this.logger.error(`Zibal request failed: ${response.result} ${response.message}`);
      throw new BadRequestException(
        response.message || 'خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید',
      );
    }

    const trackId = String(response.trackId);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentTrackId: trackId },
    });

    return {
      paymentUrl: this.zibal.getStartUrl(trackId),
      trackId,
    };
  }

  async handleZibalCallback(query: {
    trackId?: string;
    success?: string;
    orderId?: string;
    status?: string;
  }): Promise<{ ok: boolean; orderId?: string; reason?: string }> {
    const { trackId, success, orderId } = query;

    if (!trackId || !orderId) {
      return { ok: false, reason: 'invalid_callback' };
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { ok: false, orderId, reason: 'order_not_found' };
    }

    if (
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED'
    ) {
      return { ok: true, orderId };
    }

    if (success !== '1') {
      return { ok: false, orderId, reason: 'payment_cancelled' };
    }

    const verify = await this.zibal.verifyPayment(trackId);

    if (verify.result !== ZIBAL_SUCCESS && verify.result !== ZIBAL_ALREADY_VERIFIED) {
      this.logger.warn(
        `Zibal verify failed for order ${orderId}: ${verify.result} ${verify.message}`,
      );
      return { ok: false, orderId, reason: 'verify_failed' };
    }

    const expectedRial = tomanToRial(order.total);
    if (verify.amount != null && verify.amount !== expectedRial) {
      this.logger.error(
        `Amount mismatch order ${orderId}: expected ${expectedRial}, got ${verify.amount}`,
      );
      return { ok: false, orderId, reason: 'amount_mismatch' };
    }

    if (order.paymentTrackId && order.paymentTrackId !== trackId) {
      this.logger.warn(`TrackId mismatch for order ${orderId}`);
      return { ok: false, orderId, reason: 'track_mismatch' };
    }

    await this.ordersService.fulfillAfterPayment(orderId, {
      trackId,
      refNumber: verify.refNumber != null ? String(verify.refNumber) : null,
      paidAt: verify.paidAt ? new Date(verify.paidAt) : new Date(),
    });

    return { ok: true, orderId };
  }
}
