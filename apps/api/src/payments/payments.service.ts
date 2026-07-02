import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  getPaymentGatewayLabel,
  getPaymentPurposeAmount,
  getPaymentPurposeLabel,
  PAYMENT_GATEWAYS,
  PAYMENT_PURPOSES,
  type PaymentGateway,
  type PaymentPurpose,
  SITE_NAME_FA,
} from '@offroad/shared';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { PrismaService } from '../prisma/prisma.service';
import type { InitiatePaymentDto, PreparePaymentDto } from './dto/initiate-payment.dto';
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

type CallbackResult = {
  ok: boolean;
  kind: 'order' | 'listing';
  orderId?: string;
  paymentSessionId?: string;
  productId?: string;
  purpose?: PaymentPurpose;
  nextPurpose?: PaymentPurpose | null;
  requiresAdminApproval?: boolean;
  reason?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly zibal: ZibalService,
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
    @Inject('ZIBAL_CALLBACK_URL') private readonly callbackUrl: string,
  ) {}

  async prepareListingPayment(userId: string, body: PreparePaymentDto) {
    const product = await this.productsService.assertPaymentPurposeAllowed(
      body.productId,
      userId,
      body.purpose,
    );
    const amount = getPaymentPurposeAmount(body.purpose);
    const images = JSON.parse(product.images || '[]') as string[];

    return {
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        image: images[0] ?? null,
        status: product.status,
        listingPaymentDueAt: product.listingPaymentDueAt,
      },
      purpose: body.purpose,
      purposeLabel: getPaymentPurposeLabel(body.purpose),
      amount,
      nextPurpose: body.nextPurpose ?? null,
      gateways: [
        {
          id: PAYMENT_GATEWAYS.ZIBAL,
          label: getPaymentGatewayLabel(PAYMENT_GATEWAYS.ZIBAL),
          enabled: true,
        },
      ],
    };
  }

  async initiateListingPayment(userId: string, body: InitiatePaymentDto) {
    if (body.gateway !== PAYMENT_GATEWAYS.ZIBAL) {
      throw new BadRequestException('درگاه پرداخت انتخاب‌شده هنوز فعال نیست');
    }

    const product = await this.productsService.assertPaymentPurposeAllowed(
      body.productId,
      userId,
      body.purpose,
    );
    const amount = getPaymentPurposeAmount(body.purpose);
    const amountRial = tomanToRial(amount);
    if (amountRial < 1000) {
      throw new BadRequestException('مبلغ پرداخت برای درگاه آنلاین کافی نیست');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const session = await this.prisma.paymentSession.create({
      data: {
        userId,
        productId: body.productId,
        purpose: body.purpose,
        gateway: body.gateway,
        amount,
        nextPurpose: body.nextPurpose ?? null,
      },
    });

    this.logger.log(
      `Initiating Zibal payment session ${session.id} (${body.purpose}) — ${amountRial} Rial`,
    );

    const response = await this.zibal.requestPayment({
      amount: amountRial,
      callbackUrl: this.callbackUrl,
      orderId: session.id,
      description: `${getPaymentPurposeLabel(body.purpose)} — ${SITE_NAME_FA}`,
      mobile: user.phone,
    });

    if (response.result !== ZIBAL_REQUEST_SUCCESS || !response.trackId) {
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      });
      this.logger.error(`Zibal request failed: ${response.result} ${response.message}`);
      throw new BadRequestException(
        response.message || 'خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید',
      );
    }

    const trackId = String(response.trackId);
    await this.prisma.paymentSession.update({
      where: { id: session.id },
      data: { trackId },
    });

    return {
      paymentSessionId: session.id,
      paymentUrl: this.zibal.getStartUrl(trackId),
      trackId,
      amount,
      purpose: body.purpose,
      productId: product.id,
    };
  }

  async getPaymentSession(sessionId: string, userId: string) {
    const session = await this.prisma.paymentSession.findUnique({
      where: { id: sessionId },
      include: {
        product: {
          select: { id: true, title: true, price: true, images: true, status: true },
        },
      },
    });
    if (!session) throw new NotFoundException('تراکنش پرداخت یافت نشد');
    if (session.userId !== userId) {
      throw new BadRequestException('دسترسی به این تراکنش مجاز نیست');
    }

    const images = JSON.parse(session.product.images || '[]') as string[];
    return {
      id: session.id,
      status: session.status,
      purpose: session.purpose,
      purposeLabel: getPaymentPurposeLabel(session.purpose),
      gateway: session.gateway,
      amount: session.amount,
      nextPurpose: session.nextPurpose,
      paidAt: session.paidAt,
      product: {
        id: session.product.id,
        title: session.product.title,
        price: session.product.price,
        image: images[0] ?? null,
        status: session.product.status,
      },
    };
  }

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

  private async findPaymentSessionForCallback(sessionId?: string, trackId?: string | null) {
    const normalizedTrackId = normalizeTrackId(trackId);

    if (sessionId?.trim()) {
      const byId = await this.prisma.paymentSession.findUnique({ where: { id: sessionId.trim() } });
      if (byId) return byId;
    }

    if (normalizedTrackId) {
      return this.prisma.paymentSession.findFirst({
        where: { trackId: normalizedTrackId },
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
  }): Promise<CallbackResult> {
    const trackId = normalizeTrackId(query.trackId);
    const { success, orderId: queryOrderId, status } = query;

    if (!trackId) {
      return { ok: false, kind: 'order', reason: 'invalid_callback' };
    }

    const paymentSession = await this.findPaymentSessionForCallback(queryOrderId, trackId);
    if (paymentSession) {
      return this.handleListingPaymentCallback(paymentSession, trackId, success, status);
    }

    const order = await this.findOrderForCallback(queryOrderId, trackId);
    if (!order) {
      return { ok: false, kind: 'order', orderId: queryOrderId, reason: 'payment_not_found' };
    }

    return this.handleOrderPaymentCallback(order, trackId, success, status);
  }

  private async handleOrderPaymentCallback(
    order: { id: string; status: string; total: number; paymentTrackId: string | null },
    trackId: string,
    success?: string,
    status?: string,
  ): Promise<CallbackResult> {
    const resolvedOrderId = order.id;

    if (
      order.status === 'CONFIRMED' ||
      order.status === 'SHIPPED' ||
      order.status === 'DELIVERED'
    ) {
      return { ok: true, kind: 'order', orderId: resolvedOrderId };
    }

    if (!isZibalCallbackSuccessful(success, status)) {
      return { ok: false, kind: 'order', orderId: resolvedOrderId, reason: 'payment_cancelled' };
    }

    const verify = await this.verifyWithRetry(trackId);

    if (!isZibalVerifySuccess(verify.result)) {
      this.logger.warn(
        `Zibal verify failed for order ${resolvedOrderId}: ${verify.result} ${verify.message}`,
      );
      return { ok: false, kind: 'order', orderId: resolvedOrderId, reason: 'verify_failed' };
    }

    const expectedRial = tomanToRial(order.total);
    const paidRial = verify.amount != null ? Number(verify.amount) : null;
    if (paidRial != null && Number.isFinite(paidRial) && paidRial !== expectedRial) {
      this.logger.error(
        `Amount mismatch order ${resolvedOrderId}: expected ${expectedRial}, got ${paidRial}`,
      );
      return { ok: false, kind: 'order', orderId: resolvedOrderId, reason: 'amount_mismatch' };
    }

    if (order.paymentTrackId && String(order.paymentTrackId) !== trackId) {
      this.logger.warn(
        `TrackId mismatch for order ${resolvedOrderId}: stored ${order.paymentTrackId}, callback ${trackId}`,
      );
      return { ok: false, kind: 'order', orderId: resolvedOrderId, reason: 'track_mismatch' };
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
      return { ok: false, kind: 'order', orderId: resolvedOrderId, reason: 'fulfillment_failed' };
    }

    return { ok: true, kind: 'order', orderId: resolvedOrderId };
  }

  private async handleListingPaymentCallback(
    session: {
      id: string;
      userId: string;
      productId: string;
      purpose: PaymentPurpose;
      status: string;
      amount: number;
      trackId: string | null;
      nextPurpose: PaymentPurpose | null;
    },
    trackId: string,
    success?: string,
    status?: string,
  ): Promise<CallbackResult> {
    if (session.status === 'COMPLETED') {
      return {
        ok: true,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        nextPurpose: session.nextPurpose,
      };
    }

    if (!isZibalCallbackSuccessful(success, status)) {
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'CANCELLED' },
      });
      return {
        ok: false,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        reason: 'payment_cancelled',
      };
    }

    const verify = await this.verifyWithRetry(trackId);
    if (!isZibalVerifySuccess(verify.result)) {
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      });
      return {
        ok: false,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        reason: 'verify_failed',
      };
    }

    const expectedRial = tomanToRial(session.amount);
    const paidRial = verify.amount != null ? Number(verify.amount) : null;
    if (paidRial != null && Number.isFinite(paidRial) && paidRial !== expectedRial) {
      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' },
      });
      return {
        ok: false,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        reason: 'amount_mismatch',
      };
    }

    if (session.trackId && String(session.trackId) !== trackId) {
      return {
        ok: false,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        reason: 'track_mismatch',
      };
    }

    try {
      let requiresAdminApproval = false;

      switch (session.purpose) {
        case PAYMENT_PURPOSES.LISTING_FEE: {
          const result = await this.productsService.fulfillListingFeePayment(session.productId);
          requiresAdminApproval = result.requiresAdminApproval;
          break;
        }
        case PAYMENT_PURPOSES.LISTING_STRENGTHENED:
          await this.productsService.fulfillStrengthenedPayment(session.productId);
          break;
        case PAYMENT_PURPOSES.LISTING_BOOST:
          await this.productsService.fulfillBoostPayment(session.productId);
          break;
        default:
          throw new BadRequestException('نوع پرداخت نامعتبر است');
      }

      await this.prisma.paymentSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
          refNumber: verify.refNumber != null ? String(verify.refNumber) : null,
          paidAt: verify.paidAt ? new Date(verify.paidAt) : new Date(),
        },
      });

      return {
        ok: true,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        nextPurpose: session.nextPurpose,
        requiresAdminApproval,
      };
    } catch (err) {
      this.logger.error(`Listing payment fulfillment failed for ${session.id}: ${String(err)}`);
      return {
        ok: false,
        kind: 'listing',
        paymentSessionId: session.id,
        productId: session.productId,
        purpose: session.purpose,
        reason: 'fulfillment_failed',
      };
    }
  }
}
