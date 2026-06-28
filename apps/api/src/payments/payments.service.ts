import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SITE_NAME_FA } from '@offroad/shared';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { tomanToRial, ZibalService } from './zibal.service';
import {
  isZibalCallbackSuccessful,
  isZibalVerifyRetryable,
  isZibalVerifySuccess,
  normalizeTrackId,
  sleep,
} from './zibal.utils';

const ZIBAL_REQUEST_SUCCESS = 100;
const VERIFY_RETRY_ATTEMPTS = 4;
const VERIFY_RETRY_DELAY_MS = 800;

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

    const total = await this.ordersService.refreshPendingOrderPricing(orderId, userId);
    const amountRial = tomanToRial(total);
    if (amountRial < 1000) {
      throw new BadRequestException('مبلغ سفارش برای پرداخت آنلاین کافی نیست');
    }

    this.logger.log(
      `Initiating Zibal payment for order ${order.id} — ${amountRial} Rial, callback ${this.callbackUrl}`,
    );

    const response = await this.zibal.requestPayment({
      amount: amountRial,
      callbackUrl: this.callbackUrl,
      orderId: order.id,
      description: `سفارش ${SITE_NAME_FA} — ${order.id.slice(-8)}`,
      mobile: order.phone ?? order.user.phone,
    });

    if (response.result !== ZIBAL_REQUEST_SUCCESS || !response.trackId) {
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

  private async findOrderForCallback(orderId?: string, trackId?: string | null) {
    const normalizedTrackId = normalizeTrackId(trackId);

    if (orderId?.trim()) {
      const byId = await this.prisma.order.findUnique({ where: { id: orderId.trim() } });
      if (byId) return byId;
    }

    if (normalizedTrackId) {
      return this.prisma.order.findFirst({
        where: { paymentTrackId: normalizedTrackId },
      });
    }

    return null;
  }

  private async verifyWithRetry(trackId: string) {
    let last = await this.zibal.verifyPayment(trackId);

    for (let attempt = 1; attempt < VERIFY_RETRY_ATTEMPTS; attempt++) {
      if (isZibalVerifySuccess(last.result)) return last;
      if (!isZibalVerifyRetryable(last.result)) return last;
      this.logger.warn(
        `Zibal verify pending for trackId ${trackId} (result ${last.result}), retry ${attempt}/${VERIFY_RETRY_ATTEMPTS - 1}`,
      );
      await sleep(VERIFY_RETRY_DELAY_MS);
      last = await this.zibal.verifyPayment(trackId);
    }

    return last;
  }

  async handleZibalCallback(query: {
    trackId?: string;
    success?: string;
    orderId?: string;
    status?: string;
  }): Promise<{ ok: boolean; orderId?: string; reason?: string }> {
    const trackId = normalizeTrackId(query.trackId);
    const { success, orderId: queryOrderId, status } = query;

    if (!trackId) {
      return { ok: false, reason: 'invalid_callback' };
    }

    const order = await this.findOrderForCallback(queryOrderId, trackId);
    if (!order) {
      return { ok: false, orderId: queryOrderId, reason: 'order_not_found' };
    }

    const resolvedOrderId = order.id;

    if (
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED'
    ) {
      return { ok: true, orderId: resolvedOrderId };
    }

    if (!isZibalCallbackSuccessful(success, status)) {
      return { ok: false, orderId: resolvedOrderId, reason: 'payment_cancelled' };
    }

    const verify = await this.verifyWithRetry(trackId);

    if (!isZibalVerifySuccess(verify.result)) {
      this.logger.warn(
        `Zibal verify failed for order ${resolvedOrderId}: ${verify.result} ${verify.message}`,
      );
      return { ok: false, orderId: resolvedOrderId, reason: 'verify_failed' };
    }

    const expectedRial = tomanToRial(order.total);
    const paidRial = verify.amount != null ? Number(verify.amount) : null;
    if (paidRial != null && Number.isFinite(paidRial) && paidRial !== expectedRial) {
      this.logger.error(
        `Amount mismatch order ${resolvedOrderId}: expected ${expectedRial}, got ${paidRial}`,
      );
      return { ok: false, orderId: resolvedOrderId, reason: 'amount_mismatch' };
    }

    if (order.paymentTrackId && String(order.paymentTrackId) !== trackId) {
      this.logger.warn(
        `TrackId mismatch for order ${resolvedOrderId}: stored ${order.paymentTrackId}, callback ${trackId}`,
      );
      return { ok: false, orderId: resolvedOrderId, reason: 'track_mismatch' };
    }

    try {
      await this.ordersService.fulfillAfterPayment(resolvedOrderId, {
        trackId,
        refNumber: verify.refNumber != null ? String(verify.refNumber) : null,
        paidAt: verify.paidAt ? new Date(verify.paidAt) : new Date(),
      });
    } catch (err) {
      this.logger.error(
        `Order fulfillment failed after payment for ${resolvedOrderId}: ${String(err)}`,
      );
      return { ok: false, orderId: resolvedOrderId, reason: 'fulfillment_failed' };
    }

    return { ok: true, orderId: resolvedOrderId };
  }
}
