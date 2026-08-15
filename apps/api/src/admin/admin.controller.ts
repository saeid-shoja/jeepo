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
import { Roles } from '../auth/custom.decorator';
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
  @Header('Cache-Control', 'no-store')
  getAllUsers(@Query() query: FindAdminUsersQueryDto) {
    return this.adminService.getAllUsers({
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 24,
    });
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

  @Post('products/guarantee')
  setProductsGuarantee(@Body() body: SetProductsGuaranteeDto) {
    return this.adminService.setProductsGuarantee(body);
  }

  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() body: UpdateProductStatusDto) {
    return this.adminService.updateProductStatus(id, body.status);
  }

  @Post('products/announce-best-price')
  announceBestPrice(@Body() body: AnnounceBestPriceDto) {
    return this.adminService.announceBestPrice(body.productIds);
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
