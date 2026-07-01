import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../prisma/generated/client';

export class CreateAdminUserDto {
  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone!: string;

  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;

  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  name!: string;

  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  password!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'نقش کاربر نامعتبر است' })
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'حداکثر آگهی باید عدد صحیح باشد' })
  @Min(1, { message: 'حداقل ۱ آگهی فعال مجاز است' })
  @Max(100, { message: 'حداکثر ۱۰۰ آگهی فعال قابل تنظیم است' })
  maxActiveListings?: number;
}
