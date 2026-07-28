const STORAGE_KEY = 'jeepo:list-scroll';

export type ListScrollState = {
  path: string;
  productId: string;
  y: number;
  /** How many list pages were loaded when the product was opened (for infinite scroll). */
  pagesLoaded: number;
};

let pagesLoaded = 1;

export function setListPagesLoaded(n: number): void {
  pagesLoaded = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function getListPagesLoaded(): number {
  return pagesLoaded;
}

export function listScrollKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function saveListScroll(productId: string): void {
  try {
    const state: ListScrollState = {
      path: listScrollKey(),
      productId,
      y: window.scrollY,
      pagesLoaded,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function peekListScroll(): ListScrollState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ListScrollState>;
    if (!parsed?.path || !parsed?.productId || typeof parsed.y !== 'number') return null;
    return {
      path: parsed.path,
      productId: parsed.productId,
      y: parsed.y,
      pagesLoaded:
        typeof parsed.pagesLoaded === 'number' && parsed.pagesLoaded >= 1
          ? Math.floor(parsed.pagesLoaded)
          : 1,
    };
  } catch {
    return null;
  }
}

export function consumeListScroll(): ListScrollState | null {
  const state = peekListScroll();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return state;
}

export function hasPendingListScrollForCurrentPath(): boolean {
  const saved = peekListScroll();
  return Boolean(saved && saved.path === listScrollKey());
}

/** Pages to preload when returning to a list (at least 1). */
export function getRestorePagesLoaded(): number {
  const saved = peekListScroll();
  if (!saved || saved.path !== listScrollKey()) return 1;
  return saved.pagesLoaded;
}
