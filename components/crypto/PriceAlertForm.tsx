"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAlerts } from "@/hooks/useAlerts";
import { getToastErrorMessage } from "@/lib/toasts";
import type { AlertCondition } from "@/types";

interface PriceAlertFormProps {
  cryptoId: string;
  cryptoSymbol: string;
  cryptoName: string;
  currentPrice?: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const normalizePrice = (value: string): number | null => {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  return price;
};

export const PriceAlertForm = ({
  cryptoId,
  cryptoSymbol,
  cryptoName,
  currentPrice,
}: PriceAlertFormProps) => {
  const normalizedCryptoId = cryptoId.trim().toLowerCase();
  const normalizedSymbol = cryptoSymbol.trim().toUpperCase();
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [condition, setCondition] = useState<AlertCondition>("above");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { activeAlerts, createPriceAlert } = useAlerts();

  const currentPriceLabel = useMemo(
    () =>
      typeof currentPrice === "number"
        ? currencyFormatter.format(currentPrice)
        : "N/A",
    [currentPrice],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = normalizePrice(targetPrice);

    if (!price) {
      toast.error("Enter a positive target price.");
      return;
    }

    const duplicateAlert = activeAlerts.some(
      (alert) =>
        alert.cryptoId === normalizedCryptoId &&
        alert.condition === condition &&
        alert.targetPrice === price,
    );

    if (duplicateAlert) {
      toast.error("You already have this active alert.");
      return;
    }

    setSubmitting(true);

    try {
      await createPriceAlert({
        cryptoId: normalizedCryptoId,
        cryptoSymbol: normalizedSymbol,
        cryptoName,
        targetPrice: price,
        condition,
      });
      setTargetPrice("");
      toast.success("Alert created.");
    } catch (createError) {
      toast.error(getToastErrorMessage(createError, "Unable to create alert."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-zinc-500">Price alert</p>
        <h2 className="text-xl font-semibold text-zinc-950">
          Create {normalizedSymbol} alert
        </h2>
        <p className="text-sm text-zinc-600">
          Current price: {currentPriceLabel}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label
            htmlFor="alert-condition"
            className="block text-sm font-medium text-zinc-700"
          >
            Condition
          </label>
          <select
            id="alert-condition"
            value={condition}
            onChange={(event) =>
              setCondition(event.target.value as AlertCondition)
            }
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="above">Above</option>
            <option value="below">Below</option>
          </select>
        </div>

        <div className="sm:col-span-1">
          <label
            htmlFor="alert-target-price"
            className="block text-sm font-medium text-zinc-700"
          >
            Target price
          </label>
          <input
            id="alert-target-price"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={targetPrice}
            onChange={(event) => setTargetPrice(event.target.value)}
            placeholder="0.00"
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-end sm:col-span-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create alert"}
          </button>
        </div>
      </form>

    </section>
  );
};

export default PriceAlertForm;
