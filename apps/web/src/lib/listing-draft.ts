import type { NewProductFormValues } from '@/lib/validations/product';

const DRAFT_KEY = 'jeepo:listing-draft:v1';

export type ListingDraft = {
  values: NewProductFormValues;
  /** After auth, new page should auto-submit this draft. */
  pendingPublish: boolean;
  savedAt: number;
};

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

export function saveListingDraft(values: NewProductFormValues, pendingPublish: boolean): boolean {
  if (!canUseSessionStorage()) return false;
  const draft: ListingDraft = {
    values,
    pendingPublish,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    // QuotaExceeded (large images) — retry without images so text fields survive auth.
    try {
      const slim: ListingDraft = {
        ...draft,
        values: { ...values, images: [] },
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}

export function loadListingDraft(): ListingDraft | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ListingDraft;
    if (!parsed?.values || typeof parsed.values !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearListingDraft(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function markListingDraftPendingPublish(pending: boolean): void {
  const draft = loadListingDraft();
  if (!draft) return;
  saveListingDraft(draft.values, pending);
}

export function buildLoginUrlForListingPublish(): string {
  const callbackUrl = '/products/new';
  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export function buildRegisterUrlForListingPublish(): string {
  const callbackUrl = '/products/new';
  return `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
