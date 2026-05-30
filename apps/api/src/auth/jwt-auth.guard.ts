import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './custom.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      const req = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
      if (req.headers?.authorization?.startsWith('Bearer ')) {
        return super.canActivate(context) as boolean | Promise<boolean>;
      }
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic && (err || !user)) {
      return null as TUser;
    }
    if (err || !user) {
      throw err || new UnauthorizedException('لطفاً ابتدا وارد حساب خود شوید');
    }
    return user;
  }
}
