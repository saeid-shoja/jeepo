import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from '../favorites/favorites.service';
import { MessagesService } from '../messages/messages.service';
import { PushSubscribeDto, PushUnsubscribeDto } from '../push/dto/push-subscribe.dto';
import { PushService } from '../push/push.service';
import { SWAGGER_BEARER_KEY } from '../swagger';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { ChangePasswordDto, UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth(SWAGGER_BEARER_KEY)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private messagesService: MessagesService,
    private favoritesService: FavoritesService,
    private telegramBotService: TelegramBotService,
    private pushService: PushService,
  ) {}

  @Get('profile')
  getProfile(@Request() req: { user: { userId: string } }) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get('telegram/link')
  getTelegramLink(@Request() req: { user: { userId: string } }) {
    return this.telegramBotService.createLinkForUser(req.user.userId);
  }

  @Get('push/config')
  getPushConfig() {
    return this.pushService.getConfig();
  }

  @Post('push/subscribe')
  subscribePush(
    @Request() req: { user: { userId: string } },
    @Body() body: PushSubscribeDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.pushService.subscribe(req.user.userId, body, userAgent);
  }

  @Delete('push/subscribe')
  unsubscribePush(@Request() req: { user: { userId: string } }, @Body() body: PushUnsubscribeDto) {
    return this.pushService.unsubscribe(req.user.userId, body.endpoint);
  }

  @Get('products')
  getUserProducts(@Request() req: { user: { userId: string } }) {
    return this.usersService.getUserProducts(req.user.userId);
  }

  @Patch('profile')
  updateProfile(@Request() req: { user: { userId: string } }, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Patch('profile/password')
  changePassword(@Request() req: { user: { userId: string } }, @Body() body: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.userId, body);
  }

  @Get('messages')
  getMessages(@Request() req: { user: { userId: string } }) {
    return this.messagesService.getUserMessages(req.user.userId);
  }

  @Get('messages/unread-count')
  getUnreadCount(@Request() req: { user: { userId: string } }) {
    return this.messagesService.getUnreadCount(req.user.userId);
  }

  @Patch('messages/read-all')
  markAllAsRead(@Request() req: { user: { userId: string } }) {
    return this.messagesService.markAllAsRead(req.user.userId);
  }

  @Patch('messages/:id/read')
  markAsRead(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.messagesService.markAsRead(req.user.userId, id);
  }

  @Get('favorites/ids')
  getFavoriteIds(@Request() req: { user: { userId: string } }) {
    return this.favoritesService
      .getProductIds(req.user.userId)
      .then((productIds) => ({ productIds }));
  }

  @Get('favorites')
  getFavorites(@Request() req: { user: { userId: string } }) {
    return this.favoritesService.listProducts(req.user.userId);
  }

  @Post('favorites/:productId')
  addFavorite(@Request() req: { user: { userId: string } }, @Param('productId') productId: string) {
    return this.favoritesService.add(req.user.userId, productId);
  }

  @Delete('favorites/:productId')
  removeFavorite(
    @Request() req: { user: { userId: string } },
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.remove(req.user.userId, productId);
  }
}
