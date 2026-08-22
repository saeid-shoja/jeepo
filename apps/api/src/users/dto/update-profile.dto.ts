import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';

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
}
