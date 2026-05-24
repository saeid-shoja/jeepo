import { Controller, Post, Get, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './custom.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('register')
  register(
    @Body() body: { phone: string; name: string; password: string; city?: string },
  ) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  login(@Body() body: { phone: string; password: string }) {
    return this.authService.login(body);
  }

  @Get('profile')
  getProfile(@Request() req: { user: { userId: string } }) {
    return this.authService.getProfile(req.user.userId);
  }
}
