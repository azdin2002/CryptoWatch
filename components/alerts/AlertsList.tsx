"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAlerts } from "@/hooks/useAlerts";
import { getToastErrorMessage } from "@/lib/toasts";
import type { AlertRecord } from "@/types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatAlertDate = (value: string): string => {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "N/A" : dateFormatter.format(date);
};

const getConditionLabel = (alert: AlertRecord): string =>
  `${alert.condition === "above" ? "Above" : "Below"} ${currencyFormatter.format(
    alert.targetPrice,
  )}`;

export const AlertsList = () => {
  const { alerts, loading, removePriceAlert } = useAlerts();
  const [removingAlertIds, setRemovingAlertIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleRemove = async (alertId: string): Promise<void> => {
    if (removingAlertIds.has(alertId)) {
      return;
    }

    setRemovingAlertIds((current) => {
      const next = new Set(current);
      next.add(alertId);
      return next;
    });

    try {
      await removePriceAlert(alertId);
      toast.success("Alert removed.");
    } catch (removeError) {
      toast.error(getToastErrorMessage(removeError, "Unable to remove alert."));
    } finally {
      setRemovingAlertIds((current) => {
        const next = new Set(current);
        next.delete(alertId);
        return next;
      });
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/95 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/25">
      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Price Alerts</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Saved thresholds for your tracked cryptocurrencies.
        </p>
      </div>

      {loading && alerts.length === 0 ? (
        <div className="px-5 py-6 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="px-5 py-8 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
          No price alerts yet.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {alerts.map((alert) => {
            const isRemoving = removingAlertIds.has(alert.id);

            return (
              <li
                key={alert.id}
                className="flex flex-col gap-4 px-5 py-4 transition-colors duration-200 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950 dark:text-zinc-50">
                      {alert.cryptoName}
                    </p>
                    <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {alert.cryptoSymbol}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-medium ${
                        alert.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {alert.active ? "Active" : "Triggered"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {getConditionLabel(alert)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Created {formatAlertDate(alert.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isRemoving}
                  onClick={() => {
                    void handleRemove(alert.id);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {isRemoving ? "Removing..." : "Remove"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default AlertsList;
