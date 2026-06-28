const ZIBAL_VERIFY_SUCCESS = 100;
const ZIBAL_VERIFY_ALREADY = 201;
const ZIBAL_VERIFY_NOT_PAID = 202;

export function isZibalVerifySuccess(result: number): boolean {
  return result === ZIBAL_VERIFY_SUCCESS || result === ZIBAL_VERIFY_ALREADY;
}

export function isZibalVerifyRetryable(result: number): boolean {
  return result === ZIBAL_VERIFY_NOT_PAID;
}

export function isZibalCallbackSuccessful(
  success?: string | number | null,
  status?: string | number | null,
): boolean {
  if (success != null && String(success).trim() === '1') return true;
  const statusCode = status != null ? Number(status) : Number.NaN;
  // 1 = paid verified, 2 = paid pending verify (per Zibal status table)
  return statusCode === 1 || statusCode === 2;
}

export function normalizeTrackId(trackId?: string | number | null): string | null {
  if (trackId == null) return null;
  const normalized = String(trackId).trim();
  return normalized.length > 0 ? normalized : null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
