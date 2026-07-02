import type { PaymentPurpose } from '@offroad/shared';

export function buildPaymentPageUrl(
  productId: string,
  purpose: PaymentPurpose,
  nextPurpose?: PaymentPurpose,
): string {
  const params = new URLSearchParams({ productId, purpose });
  if (nextPurpose) params.set('nextPurpose', nextPurpose);
  return `/payment?${params.toString()}`;
}
