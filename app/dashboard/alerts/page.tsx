import { AlertsList } from "@/components/alerts/AlertsList";

export default function AlertsPage() {
  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Monitoring
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Alerts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Manage all of your saved price alerts in one place.
          </p>
        </div>
      </header>

      <AlertsList />
    </>
  );
}
