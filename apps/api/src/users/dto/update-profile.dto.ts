import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateProfileDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  city?: string;

  /** Telegram @username or numeric user id (optional; empty clears). */
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  })
  @IsOptional()
  @IsString()
  @Matches(/^([a-zA-Z][a-zA-Z0-9_]{4,31}|\d{5,15})$/, {
    message: 'آیدی تلگرام معتبر نیست (مثال: username یا @username)',
  })
  telegramId?: string | null;
}
