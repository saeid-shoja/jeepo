import { ALL_ADMIN_PERMISSION_KEYS } from '@offroad/shared';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../prisma/generated/client';

const ADMIN_LISTING_CAP_MAX = 999;

export class CreateAdminUserDto {
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone!: string;

  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name!: string;

  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'نقش کاربر نامعتبر است' })
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'حداکثر آگهی باید عدد صحیح باشد' })
  @Min(1, { message: 'حداقل ۱ آگهی فعال مجاز است' })
  @Max(ADMIN_LISTING_CAP_MAX, {
    message: `حداکثر ${ADMIN_LISTING_CAP_MAX.toLocaleString('fa-IR')} آگهی فعال قابل تنظیم است`,
  })
  maxActiveListings?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'حداکثر آگهی نو باید عدد صحیح باشد' })
  @Min(1, { message: 'حداقل ۱ آگهی نو فعال مجاز است' })
  @Max(ADMIN_LISTING_CAP_MAX, {
    message: `حداکثر ${ADMIN_LISTING_CAP_MAX.toLocaleString('fa-IR')} آگهی نو فعال قابل تنظیم است`,
  })
  maxActiveNewListings?: number;

  /** Super admin only — when creating an ADMIN user. */
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  /** Super admin only — sidebar sections for new ADMIN user. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALL_ADMIN_PERMISSION_KEYS, { each: true })
  adminPermissions?: string[];
}
