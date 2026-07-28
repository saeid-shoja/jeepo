import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../prisma/generated/client';

const ADMIN_LISTING_CAP_MAX = 999;

function optionalNullableInt({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : value;
  }
  return value;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password?: string;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsEnum(UserRole, { message: 'نقش کاربر نامعتبر است' })
  role?: UserRole;

  /** Custom free active listing cap. null = reset to platform default. */
  @IsOptional()
  @Transform(optionalNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'حداکثر آگهی باید عدد صحیح باشد' })
  @Min(1, { message: 'حداقل ۱ آگهی فعال مجاز است' })
  @Max(ADMIN_LISTING_CAP_MAX, {
    message: `حداکثر ${ADMIN_LISTING_CAP_MAX.toLocaleString('fa-IR')} آگهی فعال قابل تنظیم است`,
  })
  maxActiveListings?: number | null;

  /** Custom ACTIVE+NEW listing cap. null = reset to platform default. */
  @IsOptional()
  @Transform(optionalNullableInt)
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt({ message: 'حداکثر آگهی نو باید عدد صحیح باشد' })
  @Min(1, { message: 'حداقل ۱ آگهی نو فعال مجاز است' })
  @Max(ADMIN_LISTING_CAP_MAX, {
    message: `حداکثر ${ADMIN_LISTING_CAP_MAX.toLocaleString('fa-IR')} آگهی نو فعال قابل تنظیم است`,
  })
  maxActiveNewListings?: number | null;
}
