import { PAYMENT_GATEWAYS, PAYMENT_PURPOSES, type PaymentGateway, type PaymentPurpose } from '@offroad/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  productId!: string;

  @IsEnum(PAYMENT_PURPOSES)
  purpose!: PaymentPurpose;

  @IsEnum(PAYMENT_GATEWAYS)
  gateway!: PaymentGateway;

  @IsOptional()
  @IsEnum(PAYMENT_PURPOSES)
  nextPurpose?: PaymentPurpose;
}

export class PreparePaymentDto {
  @IsString()
  productId!: string;

  @IsEnum(PAYMENT_PURPOSES)
  purpose!: PaymentPurpose;

  @IsOptional()
  @IsEnum(PAYMENT_PURPOSES)
  nextPurpose?: PaymentPurpose;
}
