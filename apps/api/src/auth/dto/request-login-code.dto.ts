import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class RequestLoginCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;
}
