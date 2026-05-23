"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CryptoTable } from "@/components/crypto/CryptoTable";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { ApiResponse, CryptoDetail, CryptoMarket } from "@/types";

const mapDetailToMarket = (crypto: CryptoDetail): CryptoMarket => {
  const marketData = crypto.market_data;

  return {
    id: crypto.id,
    symbol: crypto.symbol,
    name: crypto.name,
    image: crypto.image.small,
    current_price: marketData.current_price.usd,
    market_cap: marketData.market_cap.usd,
    market_cap_rank: crypto.market_cap_rank,
    fully_diluted_valuation: marketData.fully_diluted_valuation.usd ?? null,
    total_volume: marketData.total_volume.usd,
    high_24h: marketData.high_24h.usd ?? null,
    low_24h: marketData.low_24h.usd ?? null,
    price_change_24h: marketData.price_change_24h,
    price_change_percentage_24h: marketData.price_change_percentage_24h,
    market_cap_change_24h: marketData.market_cap_change_24h,
    market_cap_change_percentage_24h:
      marketData.market_cap_change_percentage_24h,
    circulating_supply: marketData.circulating_supply,
    total_supply: marketData.total_supply,
    max_supply: marketData.max_supply,
    ath: marketData.ath.usd ?? null,
    ath_change_percentage: marketData.ath_change_percentage.usd ?? null,
    ath_date: marketData.ath_date.usd ?? null,
    atl: marketData.atl.usd ?? null,
    atl_change_percentage: marketData.atl_change_percentage.usd ?? null,
    atl_date: marketData.atl_date.usd ?? null,
    roi: marketData.roi,
    last_updated: crypto.last_updated,
  };
};

const fetchCryptoDetail = async (
  cryptoId: string,
  signal: AbortSignal,
): Promise<CryptoMarket> => {
  const params = new URLSearchParams({
    endpoint: "detail",
    id: cryptoId,
  });
  const response = await fetch(`/api/crypto?${params.toString()}`, {
    signal,
  });
  const payload = (await response.json()) as ApiResponse<CryptoDetail>;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(payload.error ?? "Unable to load watchlist data.");
  }

  return mapDetailToMarket(payload.data);
};

export default function WatchlistPage() {
  const { watchlist, loading: watchlistLoading, error: watchlistError } =
    useWatchlist();
  const [cryptos, setCryptos] = useState<CryptoMarket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const requestKey = useMemo(() => watchlist.join(","), [watchlist]);

  useEffect(() => {
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
        const marketRows = await Promise.all(
          watchlist.map((cryptoId) =>
            fetchCryptoDetail(cryptoId, controller.signal),
          ),
        );

        setCryptos(marketRows);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load watchlist data.",
        );
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
  }, [requestKey, watchlist]);

  const hasSavedCryptos = watchlist.length > 0;
  const visibleCryptos = hasSavedCryptos
    ? cryptos.filter((crypto) => watchlist.includes(crypto.id))
    : [];

  return (
    <>
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Portfolio
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Watchlist
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            Your saved cryptocurrencies with quick access to details and
            watchlist controls.
          </p>
        </div>
      </header>

      {!hasSavedCryptos && !watchlistLoading ? (
        <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">
            Your watchlist is empty
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
            Add coins from the market dashboard or a crypto detail page to see
            them here.
          </p>
        </section>
      ) : (
        <CryptoTable
          cryptos={visibleCryptos}
          loading={watchlistLoading || loading}
          error={watchlistError ?? error}
        />
      )}
    </>
  );
}
