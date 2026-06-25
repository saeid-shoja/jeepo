import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class VerifyEmailDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;

  @Transform(trim)
  @IsString()
  @Length(6, 6, { message: 'کد تأیید باید ۶ رقم باشد' })
  @Matches(/^\d{6}$/, { message: 'کد تأیید باید ۶ رقم باشد' })
  code!: string;
}
