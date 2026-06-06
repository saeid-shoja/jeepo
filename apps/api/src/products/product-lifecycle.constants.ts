export const AD_ACTIVE_DAYS = 30;
export const DEPRECATED_DELETE_DAYS = 10;

export const AD_ACTIVE_MS = AD_ACTIVE_DAYS * 24 * 60 * 60 * 1000;
export const DEPRECATED_DELETE_MS = DEPRECATED_DELETE_DAYS * 24 * 60 * 60 * 1000;

export function computeActiveUntil(from = new Date()): Date {
  return new Date(from.getTime() + AD_ACTIVE_MS);
}

export function computeDeletionAt(deprecatedAt: Date): Date {
  return new Date(deprecatedAt.getTime() + DEPRECATED_DELETE_MS);
}
