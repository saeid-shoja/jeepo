import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from '../auth/custom.decorator';
import type { AdminService } from './admin.service';
import type { FindAdminProductsQueryDto, UpdateProductStatusDto } from './dto';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('products')
  getAllProducts(@Query() query: FindAdminProductsQueryDto) {
    return this.adminService.getAllProducts({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      advertiser: query.advertiser,
      status: query.status,
    });
  }

  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() body: UpdateProductStatusDto) {
    return this.adminService.updateProductStatus(id, body.status);
  }
}
