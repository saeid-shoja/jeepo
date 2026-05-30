import { Body, Controller, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { Public, Roles } from '../auth/custom.decorator';
import type { CreateOrderDto, PreviewOrderDto, UpdateOrderStatusDto } from './dto';
import type { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

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
  create(@Request() req: { user: { userId: string } }, @Body() body: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, body);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body.status);
  }
}
