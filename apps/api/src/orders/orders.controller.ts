import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/custom.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) { }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('my')
  findByUser(@Request() req: { user: { userId: string } }) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; role: string } },
  ) {
    return this.ordersService.findOne(id, req.user.userId, req.user.role);
  }

  @Post()
  create(
    @Request() req: { user: { userId: string } },
    @Body() body: { items: any[]; address?: string },
  ) {
    return this.ordersService.create({
      userId: req.user.userId,
      items: body.items,
      address: body.address,
    });
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status);
  }
}
