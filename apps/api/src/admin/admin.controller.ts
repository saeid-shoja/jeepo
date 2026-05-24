import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/custom.decorator';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) { }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('products')
  getAllProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllProducts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      type,
      status,
    });
  }

  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateProductStatus(id, body.status);
  }
}
