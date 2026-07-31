import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class PushSubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys!: PushSubscriptionKeysDto;
}

export class PushUnsubscribeDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string;
}
