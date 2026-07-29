'use client';

import { useEffect, useRef } from 'react';
import {
  consumeListScroll,
  hasPendingListScrollForCurrentPath,
  listScrollKey,
  peekListScroll,
} from '@/lib/list-scroll-restore';

/** Restore scroll to the product card the user opened, after the list is ready. */
export function useRestoreListScroll(ready: boolean) {
  const doneRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      history.scrollRestoration = 'manual';
    } catch {
      // ignore
    }
    if (!hasPendingListScrollForCurrentPath()) return;
    const saved = peekListScroll();
    if (saved) {
      window.scrollTo({ top: saved.y, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (!ready || doneRef.current) return;
    if (!hasPendingListScrollForCurrentPath()) return;

    const saved = peekListScroll();
    if (!saved || saved.path !== listScrollKey()) return;

    let cancelled = false;
    let attempts = 0;

    const finish = (scrollTop?: number) => {
      if (doneRef.current || cancelled) return;
      doneRef.current = true;
      consumeListScroll();
      if (typeof scrollTop === 'number') {
        window.scrollTo({ top: scrollTop, left: 0, behavior: 'auto' });
      }
    };

    const tryRestore = () => {
      if (cancelled || doneRef.current) return true;
      const el = document.querySelector(
        `[data-product-id="${CSS.escape(saved.productId)}"]`,
      ) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' });
        finish();
        return true;
      }
      return false;
    };

    const tick = () => {
      if (tryRestore()) return;
      attempts += 1;
      if (attempts >= 30) {
        finish(saved.y);
        return;
      }
      window.setTimeout(tick, 50);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);
}
