'use client';

import { useEffect, useRef } from 'react';

/** Exact snippet from enamad.ir — must not be altered for verification. */
const ENAMAD_TRUST_SEAL_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=768399&Code=ASyzlnggFiTKqayu03wH5SbFi7KUKM2I'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=768399&Code=ASyzlnggFiTKqayu03wH5SbFi7KUKM2I' alt='' style='cursor:pointer' code='ASyzlnggFiTKqayu03wH5SbFi7KUKM2I'></a>";

export function EnamadTrustSeal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || el.querySelector('a')) return;
    el.innerHTML = ENAMAD_TRUST_SEAL_HTML;
  }, []);

  return (
    <div
      ref={containerRef}
      id="enamad"
      className="flex min-h-28.75 min-w-27.5 shrink-0 items-center justify-center [&_a]:inline-block [&_img]:block [&_img]:h-auto [&_img]:max-w-[110px]"
    />
  );
}
