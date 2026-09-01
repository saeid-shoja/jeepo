import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type AdminPermissionKey, hasAdminPermission } from '@offroad/shared';
import { ADMIN_PERMISSION_KEY, IS_PUBLIC_KEY } from './custom.decorator';

type RequestUser = {
  role: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
  adminAccessConfigured?: boolean;
};

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const permission = this.reflector.getAllAndOverride<AdminPermissionKey>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!user) throw new ForbiddenException('دسترسی غیرمجاز');
    if (user.role !== 'ADMIN') return true;

    if (hasAdminPermission(user, permission)) return true;

    throw new ForbiddenException('شما به این بخش دسترسی ندارید');
  }
}
