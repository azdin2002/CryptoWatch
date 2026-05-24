"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useWatchlist } from "@/hooks/useWatchlist";
import { getToastErrorMessage } from "@/lib/toasts";
import type { CryptoMarket } from "@/types";

type SortField =
  | "market_cap_rank"
  | "name"
  | "symbol"
  | "current_price"
  | "price_change_percentage_24h"
  | "market_cap"
  | "total_volume";

type SortDirection = "asc" | "desc";

interface CryptoTableProps {
  cryptos: CryptoMarket[];
  loading?: boolean;
  error?: string | null;
}

interface Column {
  field: SortField;
  label: string;
  className?: string;
  align?: "left" | "right";
}

const columns: Column[] = [
  { field: "market_cap_rank", label: "Rank" },
  { field: "name", label: "Name" },
  { field: "symbol", label: "Symbol", className: "hidden sm:table-cell" },
  { field: "current_price", label: "Price", align: "right" },
  {
    field: "price_change_percentage_24h",
    label: "24h",
    align: "right",
    className: "hidden sm:table-cell",
  },
  {
    field: "market_cap",
    label: "Market Cap",
    align: "right",
    className: "hidden md:table-cell",
  },
  {
    field: "total_volume",
    label: "Volume",
    align: "right",
    className: "hidden lg:table-cell",
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const getSortableValue = (
  crypto: CryptoMarket,
  field: SortField,
): string | number => {
  const value = crypto[field];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return Number.NEGATIVE_INFINITY;
};

const sortCryptos = (
  cryptos: CryptoMarket[],
  field: SortField,
  direction: SortDirection,
): CryptoMarket[] =>
  [...cryptos].sort((first, second) => {
    const firstValue = getSortableValue(first, field);
    const secondValue = getSortableValue(second, field);
    const directionMultiplier = direction === "asc" ? 1 : -1;

    if (typeof firstValue === "number" && typeof secondValue === "number") {
      return (firstValue - secondValue) * directionMultiplier;
    }

    return String(firstValue).localeCompare(String(secondValue)) * directionMultiplier;
  });

const formatCurrency = (value: number | null): string =>
  value === null ? "N/A" : currencyFormatter.format(value);

const formatCompactCurrency = (value: number | null): string =>
  value === null ? "N/A" : compactCurrencyFormatter.format(value);

const formatPercentage = (value: number | null): string =>
  value === null ? "N/A" : `${percentFormatter.format(value)}%`;

export const CryptoTable = ({
  cryptos,
  loading = false,
  error = null,
}: CryptoTableProps) => {
  const [sortField, setSortField] = useState<SortField>("market_cap_rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [syncingCryptoIds, setSyncingCryptoIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [optimisticWatchlistStatus, setOptimisticWatchlistStatus] = useState<
    Map<string, boolean>
  >(() => new Map());
  const {
    loading: watchlistLoading,
    isInWatchlist,
    addCrypto,
    removeCrypto,
  } = useWatchlist();

  const sortedCryptos = useMemo(
    () => sortCryptos(cryptos, sortField, sortDirection),
    [cryptos, sortDirection, sortField],
  );

  const handleSort = (field: SortField): void => {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "name" || field === "symbol" ? "asc" : "desc");
  };

  const handleWatchlistToggle = useCallback(
    async (cryptoId: string): Promise<void> => {
      const normalizedCryptoId = cryptoId.trim().toLowerCase();

      if (watchlistLoading || syncingCryptoIds.has(normalizedCryptoId)) {
        return;
      }

      const wasSaved =
        optimisticWatchlistStatus.get(normalizedCryptoId) ??
        isInWatchlist(normalizedCryptoId);

      setSyncingCryptoIds((current) => {
        const next = new Set(current);
        next.add(normalizedCryptoId);
        return next;
      });
      setOptimisticWatchlistStatus((current) => {
        const next = new Map(current);
        next.set(normalizedCryptoId, !wasSaved);
        return next;
      });

      try {
        if (wasSaved) {
          await removeCrypto(normalizedCryptoId);
          toast.success("Removed from watchlist.");
        } else {
          await addCrypto(normalizedCryptoId);
          toast.success("Added to watchlist.");
        }
      } catch (toggleError) {
        setOptimisticWatchlistStatus((current) => {
          const next = new Map(current);
          next.set(normalizedCryptoId, wasSaved);
          return next;
        });
        toast.error(
          getToastErrorMessage(toggleError, "Unable to update watchlist."),
        );
      } finally {
        setOptimisticWatchlistStatus((current) => {
          const next = new Map(current);
          next.delete(normalizedCryptoId);
          return next;
        });
        setSyncingCryptoIds((current) => {
          const next = new Set(current);
          next.delete(normalizedCryptoId);
          return next;
        });
      }
    },
    [
      addCrypto,
      isInWatchlist,
      optimisticWatchlistStatus,
      removeCrypto,
      syncingCryptoIds,
      watchlistLoading,
    ],
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
        Loading market data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${
                    column.align === "right" ? "text-right" : "text-left"
                  } ${column.className ?? ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column.field)}
                    className={`inline-flex items-center gap-1 transition-colors hover:text-zinc-900 ${
                      column.align === "right" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {column.label}
                    {sortField === column.field ? (
                      <span aria-hidden="true">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    ) : null}
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="px-4 py-3 text-right font-semibold"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {sortedCryptos.map((crypto) => {
              const change = crypto.price_change_percentage_24h;
              const isPositive = change !== null && change >= 0;
              const cryptoId = crypto.id.trim().toLowerCase();
              const isSaved =
                optimisticWatchlistStatus.get(cryptoId) ??
                isInWatchlist(cryptoId);
              const isSyncing =
                watchlistLoading || syncingCryptoIds.has(cryptoId);
              const cryptoHref = `/dashboard/crypto/${encodeURIComponent(
                cryptoId,
              )}`;

              return (
                <tr
                  key={crypto.id}
                  className="transition-colors hover:bg-zinc-50"
                >
                  <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                    {crypto.market_cap_rank ?? "N/A"}
                  </td>
                  <td className="min-w-48 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={cryptoHref}
                        aria-label={`View ${crypto.name} details`}
                        className="shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        <Image
                          src={crypto.image}
                          alt={`${crypto.name} logo`}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      </Link>
                      <div>
                        <Link
                          href={cryptoHref}
                          className="cursor-pointer font-medium text-zinc-950 transition-colors hover:text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          {crypto.name}
                        </Link>
                        <div className="text-xs uppercase text-zinc-500 sm:hidden">
                          {crypto.symbol}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-4 uppercase text-zinc-600 sm:table-cell">
                    {crypto.symbol}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-zinc-950">
                    {formatCurrency(crypto.current_price)}
                  </td>
                  <td
                    className={`hidden whitespace-nowrap px-4 py-4 text-right font-medium sm:table-cell ${
                      isPositive ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatPercentage(change)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-4 text-right text-zinc-700 md:table-cell">
                    {formatCompactCurrency(crypto.market_cap)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-4 text-right text-zinc-700 lg:table-cell">
                    {formatCompactCurrency(crypto.total_volume)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={cryptoHref}
                        className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:px-3 sm:py-2"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => {
                          void handleWatchlistToggle(cryptoId);
                        }}
                        className={`inline-flex min-w-20 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-32 sm:px-3 sm:py-2 ${
                          isSaved
                            ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-red-50 hover:text-red-700"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isSyncing
                          ? "Saving..."
                          : isSaved
                            ? "Remove"
                            : "Add"}
                        <span className="hidden sm:inline">
                          {isSyncing || isSaved ? "" : " to Watchlist"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CryptoTable;
