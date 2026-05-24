export default function DashboardLoading() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3">
          <div className="h-10 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-full max-w-xl animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/70" />
          ))}
        </div>
      </section>
    </>
  );
}
