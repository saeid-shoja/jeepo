type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Renders Schema.org JSON-LD for Google rich results. */
export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}
