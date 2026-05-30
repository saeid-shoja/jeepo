/** Auction helpers (inlined — do not import @offroad/shared in API; Node strip-only mode breaks on TS enums) */

export function getMinimumBidIncrementRate(currentPrice: number): number {
  if (currentPrice < 50_000_000) return 0.05;
  if (currentPrice < 100_000_000) return 0.035;
  if (currentPrice < 200_000_000) return 0.02;
  return 0.01;
}

export function getMinimumBidIncrement(currentPrice: number): number {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 0;
  return Math.ceil(currentPrice * getMinimumBidIncrementRate(currentPrice));
}

export function getMinimumNextBid(currentPrice: number): number {
  return currentPrice + getMinimumBidIncrement(currentPrice);
}

export function getAuctionCurrentPrice(startPrice: number, storedCurrent?: number | null): number {
  if (storedCurrent != null && storedCurrent > 0) return storedCurrent;
  return startPrice;
}

export function isAuctionActive(endsAt: Date | string, now: Date = new Date()): boolean {
  return new Date(endsAt).getTime() > now.getTime();
}
