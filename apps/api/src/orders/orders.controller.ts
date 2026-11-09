import { Body, Controller, Get, Inject, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminPermission, Public, Roles } from '../auth/custom.decorator';
import {
  isLocalPaymentTestRequest,
  type LocalPaymentTestRequest,
} from '../payments/local-payment-test';
import { PaymentsService } from '../payments/payments.service';
import { SWAGGER_BEARER_KEY } from '../swagger';
import {
  CreateOrderDto,
  ExtendGuaranteedOrderDeadlineDto,
  PreviewOrderDto,
  ResolveGuaranteedOrderItemDto,
  SubmitPackagingEvidenceDto,
  SubmitShippingEvidenceDto,
  UpdateOrderStatusDto,
} from './dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth(SWAGGER_BEARER_KEY)
@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
    @Inject('SHOP_WEB_URL') private readonly shopWebUrl: string,
  ) {}

  @Roles('ADMIN')
  @AdminPermission('orders')
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Roles('ADMIN')
  @AdminPermission('orders')
  @Get('guaranteed')
  findAllGuaranteed() {
    return this.ordersService.findAllGuaranteed();
  }

  @Get('my')
  findByUser(@Request() req: { user: { userId: string } }) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @Get('selling')
  findSellerOrders(@Request() req: { user: { userId: string } }) {
    return this.ordersService.findSellerOrders(req.user.userId);
  }

  @Public()
  @Post('preview')
  preview(@Body() body: PreviewOrderDto) {
    return this.ordersService.preview(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user: { userId: string; role: string } }) {
    return this.ordersService.findOne(id, req.user.userId, req.user.role);
  }

  @Post()
  async create(
    @Request()
    req: LocalPaymentTestRequest & {
      headers: LocalPaymentTestRequest['headers'] & { origin?: string };
      user: { userId: string };
    },
    @Body() body: CreateOrderDto,
  ) {
    const order = await this.ordersService.create(req.user.userId, body);
    const shopCheckout = req.headers.origin ? this.isShopCheckoutOrigin(req.headers.origin) : false;
    const { paymentUrl, localTest } = await this.paymentsService.initiateForOrder(
      order.id,
      req.user.userId,
      isLocalPaymentTestRequest(req),
      shopCheckout,
    );
    return { ...order, paymentUrl, localTest };
  }

  private isShopCheckoutOrigin(origin: string): boolean {
    try {
      return new URL(origin).origin === new URL(this.shopWebUrl).origin;
    } catch {
      return false;
    }
  }

  @Roles('ADMIN')
  @AdminPermission('orders')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @Post(':id/items/:itemId/seller-confirm')
  sellerConfirmItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ordersService.sellerConfirmItem(orderId, itemId, req.user.userId);
  }

  @Post(':id/items/:itemId/packaging')
  submitPackagingEvidence(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { userId: string } },
    @Body() body: SubmitPackagingEvidenceDto,
  ) {
    return this.ordersService.submitPackagingEvidence(orderId, itemId, req.user.userId, body);
  }

  @Post(':id/items/:itemId/shipped')
  sellerMarkShipped(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { userId: string } },
    @Body() body: SubmitShippingEvidenceDto,
  ) {
    return this.ordersService.sellerMarkShipped(orderId, itemId, req.user.userId, body);
  }

  @Post(':id/items/:itemId/buyer-cancel')
  buyerCancelItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ordersService.buyerCancelItem(orderId, itemId, req.user.userId);
  }

  @Post(':id/items/:itemId/buyer-confirm')
  buyerConfirmItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ordersService.buyerConfirmItem(orderId, itemId, req.user.userId);
  }

  @Post(':id/items/:itemId/buyer-report')
  buyerReportItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.ordersService.buyerReportItem(orderId, itemId, req.user.userId);
  }

  @Roles('ADMIN')
  @AdminPermission('orders')
  @Patch(':id/items/:itemId/admin-action')
  adminResolveItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: ResolveGuaranteedOrderItemDto,
  ) {
    return this.ordersService.adminResolveItem(orderId, itemId, body.action, body.reason);
  }

  @Roles('ADMIN')
  @AdminPermission('orders')
  @Patch(':id/items/:itemId/extend-deadline')
  extendGuaranteedOrderDeadline(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: ExtendGuaranteedOrderDeadlineDto,
  ) {
    return this.ordersService.extendGuaranteedOrderDeadline(orderId, itemId, body.days);
  }

  @Roles('ADMIN')
  @AdminPermission('orders')
  @Post(':id/items/:itemId/refund-to-wallet')
  refundGuaranteedOrderToWallet(@Param('id') orderId: string, @Param('itemId') itemId: string) {
    return this.ordersService.refundGuaranteedOrderToWallet(orderId, itemId);
  }
}
