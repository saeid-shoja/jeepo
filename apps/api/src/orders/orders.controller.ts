import { Body, Controller, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../auth/custom.decorator';
import { PaymentsService } from '../payments/payments.service';
import { SWAGGER_BEARER_KEY } from '../swagger';
import { CreateOrderDto, PreviewOrderDto, UpdateOrderStatusDto } from './dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth(SWAGGER_BEARER_KEY)
@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('my')
  findByUser(@Request() req: { user: { userId: string } }) {
    return this.ordersService.findByUser(req.user.userId);
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
  async create(@Request() req: { user: { userId: string } }, @Body() body: CreateOrderDto) {
    const order = await this.ordersService.create(req.user.userId, body);
    const { paymentUrl } = await this.paymentsService.initiateForOrder(order.id, req.user.userId);
    return { ...order, paymentUrl };
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}
