import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminPermission, Roles } from '../auth/custom.decorator';
import { CreateMessageDto } from '../messages/dto';
import { MessagesService } from '../messages/messages.service';
import { SWAGGER_BEARER_KEY } from '../swagger';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { AdminService } from './admin.service';
import {
  AnnounceBestPriceDto,
  CreateAdminUserDto,
  FindAdminProductsQueryDto,
  FindAdminUsersQueryDto,
  SetProductsGuaranteeDto,
  UpdateAdminUserDto,
  UpdateProductStatusDto,
} from './dto';

type AdminRequest = {
  user: { userId: string; role: string; isSuperAdmin?: boolean; adminPermissions?: string[] };
};

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

  @Get('me')
  getMe(@Request() req: AdminRequest) {
    return this.adminService.getAdminProfile(req.user.userId);
  }

  @AdminPermission('dashboard')
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @AdminPermission('users')
  @Get('users')
  @Header('Cache-Control', 'no-store')
  getAllUsers(@Query() query: FindAdminUsersQueryDto) {
    return this.adminService.getAllUsers({
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 24,
    });
  }

  @AdminPermission('users')
  @Post('users')
  createUser(@Request() req: AdminRequest, @Body() body: CreateAdminUserDto) {
    return this.adminService.createUser(req.user.userId, body);
  }

  @AdminPermission('users')
  @Patch('users/:id')
  updateUser(
    @Request() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(req.user.userId, id, body);
  }

  @AdminPermission('users')
  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @AdminPermission('users')
  @Delete('users/:id')
  deleteUser(@Request() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteUser(req.user.userId, id);
  }

  @AdminPermission('users')
  @Get('users/:id/products')
  getUserProducts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUserProducts(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @AdminPermission('products')
  @Get('products')
  @Header('Cache-Control', 'no-store')
  getAllProducts(@Query() query: FindAdminProductsQueryDto) {
    return this.adminService.getAllProducts({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      tab: query.tab,
      advertiser: query.advertiser,
      status: query.status,
      search: query.search,
    });
  }

  @AdminPermission('products')
  @Post('products/guarantee')
  setProductsGuarantee(@Body() body: SetProductsGuaranteeDto) {
    return this.adminService.setProductsGuarantee(body);
  }

  @AdminPermission('products')
  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() body: UpdateProductStatusDto) {
    return this.adminService.updateProductStatus(id, body.status);
  }

  @AdminPermission('products')
  @Post('products/announce-best-price')
  announceBestPrice(@Body() body: AnnounceBestPriceDto) {
    return this.adminService.announceBestPrice(body.productIds);
  }

  @AdminPermission('messages')
  @Post('messages')
  sendMessage(@Body() body: CreateMessageDto, @Request() req: AdminRequest) {
    return this.messagesService.sendMessage(req.user.userId, body);
  }

  @AdminPermission('messages')
  @Get('messages')
  listMessages() {
    return this.messagesService.listBatches();
  }

  @AdminPermission('messages')
  @Get('telegram/stats')
  getTelegramStats() {
    return this.telegramBotService.getStats();
  }
}
