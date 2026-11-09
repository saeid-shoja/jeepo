import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/custom.decorator';
import { SWAGGER_BEARER_KEY } from '../swagger';
import { InitiatePaymentDto, PreparePaymentDto } from './dto/initiate-payment.dto';
import { isLocalPaymentTestRequest, type LocalPaymentTestRequest } from './local-payment-test';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    @Inject('WEB_URL') private readonly webUrl: string,
    @Inject('SHOP_WEB_URL') private readonly shopWebUrl: string,
  ) {}

  @ApiBearerAuth(SWAGGER_BEARER_KEY)
  @Post('prepare')
  prepare(@Request() req: { user: { userId: string } }, @Body() body: PreparePaymentDto) {
    return this.paymentsService.prepareListingPayment(req.user.userId, body);
  }

  @ApiBearerAuth(SWAGGER_BEARER_KEY)
  @Post('initiate')
  initiate(
    @Request() req: LocalPaymentTestRequest & { user: { userId: string } },
    @Body() body: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiateListingPayment(
      req.user.userId,
      body,
      isLocalPaymentTestRequest(req),
    );
  }

  @ApiBearerAuth(SWAGGER_BEARER_KEY)
  @Get('sessions/:id')
  getSession(@Param('id') id: string, @Request() req: { user: { userId: string } }) {
    return this.paymentsService.getPaymentSession(id, req.user.userId);
  }

  @Public()
  @Get('zibal/callback')
  async zibalCallback(
    @Query('trackId') trackId: string,
    @Query('success') success: string,
    @Query('orderId') orderId: string,
    @Query('status') status: string,
    @Query('checkoutApp') checkoutApp: string,
    @Res() res: Response,
  ) {
    const isShopCheckout = checkoutApp === 'shop';
    const isOrderCheckout = isShopCheckout || checkoutApp === 'web';
    const base = (isShopCheckout ? this.shopWebUrl : this.webUrl).replace(/\/$/, '');

    try {
      const result = await this.paymentsService.handleZibalCallback({
        trackId,
        success,
        orderId,
        status,
      });

      if (result.ok && result.kind === 'order' && result.orderId) {
        return res.redirect(
          `${base}/checkout/success?orderId=${encodeURIComponent(result.orderId)}`,
        );
      }

      if (result.ok && result.kind === 'listing') {
        const params = new URLSearchParams();
        if (result.paymentSessionId) params.set('paymentSessionId', result.paymentSessionId);
        if (result.productId) params.set('productId', result.productId);
        if (result.purpose) params.set('purpose', result.purpose);
        if (result.nextPurpose) params.set('nextPurpose', result.nextPurpose);
        if (result.requiresAdminApproval) params.set('requiresAdminApproval', '1');
        return res.redirect(`${base}/payment/success?${params.toString()}`);
      }

      if (!result.ok && result.kind === 'listing') {
        const params = new URLSearchParams();
        if (result.paymentSessionId) params.set('paymentSessionId', result.paymentSessionId);
        if (result.productId) params.set('productId', result.productId);
        if (result.purpose) params.set('purpose', result.purpose);
        if (result.reason) params.set('reason', result.reason);
        return res.redirect(`${base}/payment/failed?${params.toString()}`);
      }

      const params = new URLSearchParams();
      if (result.orderId) params.set('orderId', result.orderId);
      if (result.reason) params.set('reason', result.reason);
      return res.redirect(`${base}/checkout/failed?${params.toString()}`);
    } catch (err) {
      this.logger.error(`Zibal callback error: ${String(err)}`);
      const failurePath = isOrderCheckout ? '/checkout/failed' : '/payment/failed';
      return res.redirect(`${base}${failurePath}?reason=server_error`);
    }
  }
}
