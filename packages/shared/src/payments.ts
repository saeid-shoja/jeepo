import { BOOST_LISTING_FEE, EXTRA_LISTING_FEE, STRENGTHENED_LISTING_FEE } from './products';

export const PAYMENT_GATEWAYS = {
  ZIBAL: 'ZIBAL',
} as const;

export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[keyof typeof PAYMENT_GATEWAYS];

export const PAYMENT_PURPOSES = {
  LISTING_FEE: 'LISTING_FEE',
  LISTING_STRENGTHENED: 'LISTING_STRENGTHENED',
  LISTING_BOOST: 'LISTING_BOOST',
} as const;

export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[keyof typeof PAYMENT_PURPOSES];

export const PAYMENT_SESSION_STATUSES = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type PaymentSessionStatus =
  (typeof PAYMENT_SESSION_STATUSES)[keyof typeof PAYMENT_SESSION_STATUSES];

export function getPaymentPurposeAmount(purpose: PaymentPurpose): number {
  switch (purpose) {
    case PAYMENT_PURPOSES.LISTING_FEE:
      return EXTRA_LISTING_FEE;
    case PAYMENT_PURPOSES.LISTING_STRENGTHENED:
      return STRENGTHENED_LISTING_FEE;
    case PAYMENT_PURPOSES.LISTING_BOOST:
      return BOOST_LISTING_FEE;
    default:
      return 0;
  }
}

export function getPaymentPurposeLabel(purpose: PaymentPurpose): string {
  switch (purpose) {
    case PAYMENT_PURPOSES.LISTING_FEE:
      return 'هزینه ثبت آگهی اضافی';
    case PAYMENT_PURPOSES.LISTING_STRENGTHENED:
      return 'تقویت آگهی';
    case PAYMENT_PURPOSES.LISTING_BOOST:
      return 'پله‌شدن آگهی';
    default:
      return 'پرداخت';
  }
}

export function getPaymentGatewayLabel(gateway: PaymentGateway): string {
  switch (gateway) {
    case PAYMENT_GATEWAYS.ZIBAL:
      return 'زیبال';
    default:
      return gateway;
  }
}

export function isPaymentPurpose(value: string): value is PaymentPurpose {
  return Object.values(PAYMENT_PURPOSES).includes(value as PaymentPurpose);
}

export function isPaymentGateway(value: string): value is PaymentGateway {
  return Object.values(PAYMENT_GATEWAYS).includes(value as PaymentGateway);
}
