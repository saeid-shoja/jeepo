import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

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
}
