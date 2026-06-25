import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Iranian mobile (09xxxxxxxxx) or email address. */
  @IsString()
  @MinLength(1, { message: 'شماره موبایل یا ایمیل را وارد کنید' })
  identifier!: string;

  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password!: string;
}
