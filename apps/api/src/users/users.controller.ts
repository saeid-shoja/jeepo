import { Controller, Get, Patch, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('profile')
  getProfile(@Request() req: { user: { userId: string } }) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Get('products')
  getUserProducts(@Request() req: { user: { userId: string } }) {
    return this.usersService.getUserProducts(req.user.userId);
  }

  @Patch('profile')
  updateProfile(
    @Request() req: { user: { userId: string } },
    @Body() body: { name?: string; city?: string },
  ) {
    return this.usersService.updateProfile(req.user.userId, body);
  }
}
