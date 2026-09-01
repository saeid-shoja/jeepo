import {
  ALL_ADMIN_PERMISSION_KEYS,
  IRAN_TEN_DIGIT_REGEX,
  normalizeTenDigits,
  USER_ACCOUNT_KINDS,
  USER_ADDRESS_MAX_LENGTH,
} from '@offroad/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
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

function emptyToNull({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function tenDigitsOrNull({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return value;
  const digits = normalizeTenDigits(value);
  return digits.length ? digits : null;
}

function optionalImage({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return value;
  return value.trim() || null;
}

function optionalRating({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
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

  /** Super admin only. */
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  /** Super admin only — sidebar sections for ADMIN users. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(ALL_ADMIN_PERMISSION_KEYS, { each: true })
  adminPermissions?: string[];

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

  @Transform(tenDigitsOrNull)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @Matches(IRAN_TEN_DIGIT_REGEX, { message: 'کد ملی باید ۱۰ رقم باشد' })
  nationalId?: string | null;

  @Transform(optionalImage)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  nationalIdCardImage?: string | null;

  @Transform(optionalImage)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  consentSelfieImage?: string | null;

  @Transform(optionalImage)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  shopLicenseImage?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(USER_ADDRESS_MAX_LENGTH)
  address?: string | null;

  @Transform(tenDigitsOrNull)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @Matches(IRAN_TEN_DIGIT_REGEX, { message: 'کد پستی باید ۱۰ رقم باشد' })
  postalCode?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'تعداد گزارش تخلف باید عدد صحیح باشد' })
  @Min(0, { message: 'تعداد گزارش تخلف نمی‌تواند منفی باشد' })
  @Max(9999)
  violationReportCount?: number;

  @IsOptional()
  @IsIn(USER_ACCOUNT_KINDS, { message: 'نوع حساب نامعتبر است' })
  accountKind?: (typeof USER_ACCOUNT_KINDS)[number];

  @IsOptional()
  @IsBoolean()
  verifiedSeller?: boolean;

  @Transform(optionalRating)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsNumber({}, { message: 'امتیاز نامعتبر است' })
  @Min(0, { message: 'امتیاز حداقل ۰ است' })
  @Max(5, { message: 'امتیاز حداکثر ۵ است' })
  rating?: number | null;
}
