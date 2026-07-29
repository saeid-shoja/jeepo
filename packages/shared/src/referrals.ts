/** Each referrer earns one free boost credit per this many verified signups. */
export const REFERRALS_PER_BOOST_CREDIT = 1;

export function normalizeReferralCode(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  return code.length >= 4 ? code : undefined;
}
