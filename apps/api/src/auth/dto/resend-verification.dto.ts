import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;
}
