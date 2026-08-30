import {
  IRAN_TEN_DIGIT_REGEX,
  normalizeTenDigits,
  USER_ACCOUNT_KINDS,
  USER_ADDRESS_MAX_LENGTH,
} from '@offroad/shared';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

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

/** Optional WebP data URL (or clear with null/empty). */
function optionalImage({ value }: { value: unknown }) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return value;
  return value.trim() || null;
}

export class UpdateProfileDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name?: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  city?: string | null;

  @Transform(tenDigitsOrNull)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @Matches(IRAN_TEN_DIGIT_REGEX, { message: 'کد ملی باید ۱۰ رقم باشد' })
  nationalId?: string | null;

  @Transform(optionalImage)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(/^data:image\/webp[;,]/i, { message: 'عکس کارت ملی باید WebP باشد' })
  nationalIdCardImage?: string | null;

  @Transform(optionalImage)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(/^data:image\/webp[;,]/i, { message: 'عکس رضایت سلفی باید WebP باشد' })
  consentSelfieImage?: string | null;

  @Transform(optionalImage)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(/^data:image\/webp[;,]/i, { message: 'تصویر پروانه باید WebP باشد' })
  shopLicenseImage?: string | null;

  @Transform(emptyToNull)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(USER_ADDRESS_MAX_LENGTH, {
    message: `آدرس حداکثر ${USER_ADDRESS_MAX_LENGTH} کاراکتر باشد`,
  })
  address?: string | null;

  @Transform(tenDigitsOrNull)
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @Matches(IRAN_TEN_DIGIT_REGEX, { message: 'کد پستی باید ۱۰ رقم باشد' })
  postalCode?: string | null;

  @IsOptional()
  @IsIn(USER_ACCOUNT_KINDS, { message: 'نوع حساب نامعتبر است' })
  accountKind?: (typeof USER_ACCOUNT_KINDS)[number];
}
