import { Body, Controller, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SWAGGER_BEARER_KEY } from '../swagger';
import type { SendChatMessageDto, StartConversationDto } from './dto';
import { ProductChatsService } from './product-chats.service';

@ApiTags('Product chats')
@ApiBearerAuth(SWAGGER_BEARER_KEY)
@Controller('product-chats')
export class ProductChatsController {
  constructor(private productChatsService: ProductChatsService) {}

  @Get()
  list(@Request() req: { user: { userId: string } }) {
    return this.productChatsService.listConversations(req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Request() req: { user: { userId: string } }) {
    return this.productChatsService.getUnreadCount(req.user.userId);
  }

  @Post()
  start(@Request() req: { user: { userId: string } }, @Body() body: StartConversationDto) {
    return this.productChatsService.startConversation(req.user.userId, body.productId);
  }

  @Get(':id')
  getOne(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.productChatsService.getConversation(id, req.user.userId);
  }

  @Post(':id/messages')
  send(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: SendChatMessageDto,
  ) {
    return this.productChatsService.sendMessage(id, req.user.userId, body);
  }

  @Patch(':id/read')
  markRead(@Request() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.productChatsService.markAsRead(id, req.user.userId);
  }
}
