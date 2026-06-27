import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(trim)
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name!: string;

  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'شهر را انتخاب کنید' })
  city!: string;

  /** Telegram @username or numeric user id (optional). */
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  })
  @IsOptional()
  @IsString()
  @Matches(/^([a-zA-Z][a-zA-Z0-9_]{4,31}|\d{5,15})$/, {
    message: 'آیدی تلگرام معتبر نیست (مثال: username یا @username)',
  })
  telegramId?: string;
}
