import { Global, Module } from '@nestjs/common';
import { SITE_URL } from '@offroad/shared';

function apiPublicUrl(): string {
  const fromEnv = process.env.API_PUBLIC_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const port = process.env.PORT || '4000';
  return `http://localhost:${port}`;
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
      useValue: process.env.ZIBAL_MERCHANT || 'zibal',
    },
    {
      provide: 'ZIBAL_CALLBACK_URL',
      useValue: `${apiPublicUrl()}/api/payments/zibal/callback`,
    },
    {
      provide: 'WEB_URL',
      useValue: (process.env.WEB_URL || SITE_URL).replace(/\/$/, ''),
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
  ],
})
export class ConfigModule {}
