import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class SetUserWalletBalanceDto {
  @Type(() => Number)
  @IsInt({ message: 'موجودی کیف پول باید عدد صحیح باشد' })
  @Min(0, { message: 'موجودی کیف پول نمی‌تواند منفی باشد' })
  @Max(2_147_483_647, { message: 'موجودی کیف پول بیش از حد مجاز است' })
  walletBalance!: number;
}
