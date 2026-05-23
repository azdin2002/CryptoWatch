"use client";

import { useState } from "react";

import { useAlerts } from "@/hooks/useAlerts";
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
  const { alerts, loading, error, removePriceAlert } = useAlerts();
  const [removingAlertIds, setRemovingAlertIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const handleRemove = async (alertId: string): Promise<void> => {
    if (removingAlertIds.has(alertId)) {
      return;
    }

    setLocalError(null);
    setRemovingAlertIds((current) => {
      const next = new Set(current);
      next.add(alertId);
      return next;
    });

    try {
      await removePriceAlert(alertId);
    } catch (removeError) {
      const message =
        typeof removeError === "string"
          ? removeError
          : removeError instanceof Error
            ? removeError.message
            : "Unable to remove alert.";

      setLocalError(message);
    } finally {
      setRemovingAlertIds((current) => {
        const next = new Set(current);
        next.delete(alertId);
        return next;
      });
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <h2 className="text-xl font-semibold text-zinc-950">Price Alerts</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Saved thresholds for your tracked cryptocurrencies.
        </p>
      </div>

      {localError || error ? (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
          {localError ?? error}
        </div>
      ) : null}

      {loading && alerts.length === 0 ? (
        <div className="px-5 py-6 text-sm text-zinc-600 sm:px-6">
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="px-5 py-8 text-sm text-zinc-600 sm:px-6">
          No price alerts yet.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {alerts.map((alert) => {
            const isRemoving = removingAlertIds.has(alert.id);

            return (
              <li
                key={alert.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">
                      {alert.cryptoName}
                    </p>
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold uppercase text-zinc-600">
                      {alert.cryptoSymbol}
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        alert.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {alert.active ? "Active" : "Triggered"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">
                    {getConditionLabel(alert)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Created {formatAlertDate(alert.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isRemoving}
                  onClick={() => {
                    void handleRemove(alert.id);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
