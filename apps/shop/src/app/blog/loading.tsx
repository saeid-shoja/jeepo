export default function BlogLoading() {
  return (
    <div className="container space-y-8 pb-10">
      <div className="rounded-xl border bg-card p-6 md:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 max-w-3xl animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 max-w-2xl animate-pulse rounded bg-muted" />
      </div>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-video animate-pulse bg-muted" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
