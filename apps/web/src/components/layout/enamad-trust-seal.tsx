'use client';

import { useEffect, useRef } from 'react';

/** Exact snippet from enamad.ir — must not be altered for verification. */
const ENAMAD_TRUST_SEAL_HTML =
  "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=745923&Code=UUqyBD9oyXBa0odv13CCIZrvb5uBn2Fq'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=745923&Code=UUqyBD9oyXBa0odv13CCIZrvb5uBn2Fq' alt='' style='cursor:pointer' code='UUqyBD9oyXBa0odv13CCIZrvb5uBn2Fq'></a>";

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
      className="flex min-h-[115px] min-w-[110px] shrink-0 items-center justify-center [&_a]:inline-block [&_img]:block [&_img]:h-auto [&_img]:max-w-[110px]"
    />
  );
}
