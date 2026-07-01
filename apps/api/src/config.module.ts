import { Global, Module } from '@nestjs/common';
import { SITE_URL } from '@offroad/shared';

function apiPublicUrl(): string {
  const fromEnv = process.env.API_PUBLIC_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const port = process.env.PORT || '4000';
  return `http://localhost:${port}`;
}

function webUrl(): string {
  const fromEnv = process.env.WEB_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  return SITE_URL.replace(/\/$/, '');
}

function zibalMerchant(): string {
  const merchant = process.env.ZIBAL_MERCHANT?.trim();
  if (merchant) return merchant;
  return 'zibal';
}

/** Zibal live merchants require callback on the same domain registered in the Zibal panel (e.g. jeepo.ir). */
function zibalCallbackUrl(): string {
  const override = process.env.ZIBAL_CALLBACK_URL?.trim();
  if (override) return override.replace(/\/$/, '');
  return `${apiPublicUrl()}/api/payments/zibal/callback`;
}

function telegramBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? '';
}

function telegramBotUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME?.trim()?.replace(/^@/, '') ?? '';
}

@Global()
@Module({
  providers: [
    {
      provide: 'JWT_SECRET',
      useValue: process.env.JWT_SECRET || 'offroad-shop-secret-key-1403',
    },
    {
      provide: 'JWT_EXPIRES_IN',
      useValue: process.env.JWT_EXPIRES_IN || '7d',
    },
    {
      provide: 'RESEND_API_KEY',
      useValue: process.env.RESEND_API_KEY || '',
    },
    {
      provide: 'MAIL_FROM',
      useValue: process.env.MAIL_FROM || 'jeepo <onboarding@resend.dev>',
    },
    {
      provide: 'ZIBAL_MERCHANT',
      useValue: zibalMerchant(),
    },
    {
      provide: 'ZIBAL_CALLBACK_URL',
      useValue: zibalCallbackUrl(),
    },
    {
      provide: 'WEB_URL',
      useValue: webUrl(),
    },
    {
      provide: 'TELEGRAM_BOT_TOKEN',
      useValue: telegramBotToken(),
    },
    {
      provide: 'TELEGRAM_BOT_USERNAME',
      useValue: telegramBotUsername(),
    },
    {
      provide: 'TELEGRAM_WEBHOOK_SECRET',
      useValue: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? '',
    },
  ],
  exports: [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'RESEND_API_KEY',
    'MAIL_FROM',
    'ZIBAL_MERCHANT',
    'ZIBAL_CALLBACK_URL',
    'WEB_URL',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_BOT_USERNAME',
    'TELEGRAM_WEBHOOK_SECRET',
  ],
})
export class ConfigModule {}
