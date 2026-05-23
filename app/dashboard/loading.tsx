export default function DashboardLoading() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <div className="h-4 w-28 rounded bg-zinc-200" />
        <div className="space-y-3">
          <div className="h-10 w-72 rounded bg-zinc-200" />
          <div className="h-5 w-full max-w-xl rounded bg-zinc-200" />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-24 rounded bg-zinc-200" />
            <div className="mt-4 h-8 w-32 rounded bg-zinc-200" />
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-zinc-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-10 rounded bg-zinc-100" />
          ))}
        </div>
      </section>
    </>
  );
}
