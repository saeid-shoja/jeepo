import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'رمز عبور فعلی را وارد کنید' })
  currentPassword!: string;

  @IsString()
  @MinLength(6, { message: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' })
  newPassword!: string;
}
