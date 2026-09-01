import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const ADMIN_PERMISSION_KEY = 'adminPermission';
export const AdminPermission = (permission: string) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);
