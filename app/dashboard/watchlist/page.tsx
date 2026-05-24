"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CryptoTable } from "@/components/crypto/CryptoTable";
import { useWatchlist } from "@/hooks/useWatchlist";
import { getToastErrorMessage } from "@/lib/toasts";
import type { ApiResponse, CryptoMarket } from "@/types";

const fetchWatchlistMarkets = async (
  cryptoIds: string[],
  signal: AbortSignal,
): Promise<CryptoMarket[]> => {
  if (cryptoIds.length === 0) {
    return [];
  }

  const params = new URLSearchParams({
    endpoint: "markets",
    ids: cryptoIds.join(","),
  });
  const response = await fetch(`/api/crypto?${params.toString()}`, {
    signal,
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse<CryptoMarket[]>;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(payload.error ?? "Unable to load watchlist data.");
  }

  const marketRowsById = new Map(
    payload.data.map((marketRow) => [marketRow.id, marketRow] as const),
  );

  return cryptoIds
    .map((cryptoId) => marketRowsById.get(cryptoId))
    .filter((marketRow): marketRow is CryptoMarket => Boolean(marketRow));
};

export default function WatchlistPage() {
  const {
    watchlist,
    loading: watchlistLoading,
    hydrated: watchlistHydrated,
    error: watchlistError,
  } = useWatchlist();
  const [cryptos, setCryptos] = useState<CryptoMarket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const requestKey = useMemo(() => watchlist.join(","), [watchlist]);

  useEffect(() => {
    if (!watchlistHydrated) {
      abortControllerRef.current?.abort();
      return;
    }

    if (watchlist.length === 0) {
      abortControllerRef.current?.abort();
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const loadWatchlistCryptos = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const marketRows = await fetchWatchlistMarkets(
          watchlist,
          controller.signal,
        );

        setCryptos(marketRows);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        const message = getToastErrorMessage(
          fetchError,
          "Unable to load watchlist data.",
        );
        setError(message);
        toast.error(message, { id: "watchlist-detail-api-error" });
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    };

    void loadWatchlistCryptos();

    return () => {
      controller.abort();
    };
  }, [requestKey, watchlist, watchlistHydrated]);

  const hasSavedCryptos = watchlist.length > 0;
  const loadingWatchlistState = !watchlistHydrated || watchlistLoading;
  const visibleCryptos = hasSavedCryptos
    ? cryptos.filter((crypto) => watchlist.includes(crypto.id))
    : [];

  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Portfolio
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Watchlist
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
            Your saved cryptocurrencies with quick access to details and
            watchlist controls.
          </p>
        </div>
      </header>

      {!hasSavedCryptos && !loadingWatchlistState ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white/90 p-8 text-center shadow-lg shadow-zinc-200/50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:shadow-black/20">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Your watchlist is empty
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Add coins from the market dashboard or a crypto detail page to see
            them here.
          </p>
        </section>
      ) : (
        <CryptoTable
          cryptos={visibleCryptos}
          loading={loadingWatchlistState || loading}
          error={watchlistError ?? error}
        />
      )}
    </>
  );
}
