import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/custom.decorator';
import { CreateMessageDto } from '../messages/dto';
import { MessagesService } from '../messages/messages.service';
import { SWAGGER_BEARER_KEY } from '../swagger';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { AdminService } from './admin.service';
import {
  CreateAdminUserDto,
  FindAdminProductsQueryDto,
  UpdateAdminUserDto,
  UpdateProductStatusDto,
} from './dto';

@ApiTags('Admin')
@ApiBearerAuth(SWAGGER_BEARER_KEY)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private messagesService: MessagesService,
    private telegramBotService: TelegramBotService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('users')
  createUser(@Body() body: CreateAdminUserDto) {
    return this.adminService.createUser(body);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateAdminUserDto) {
    return this.adminService.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('products')
  getAllProducts(@Query() query: FindAdminProductsQueryDto) {
    return this.adminService.getAllProducts({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      tab: query.tab,
      advertiser: query.advertiser,
      status: query.status,
    });
  }

  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() body: UpdateProductStatusDto) {
    return this.adminService.updateProductStatus(id, body.status);
  }

  @Post('messages')
  sendMessage(@Body() body: CreateMessageDto, @Request() req: { user: { userId: string } }) {
    return this.messagesService.sendMessage(req.user.userId, body);
  }

  @Get('messages')
  listMessages() {
    return this.messagesService.listBatches();
  }

  @Get('telegram/stats')
  getTelegramStats() {
    return this.telegramBotService.getStats();
  }
}
