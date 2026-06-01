"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getToastErrorMessage } from "@/lib/toasts";
import type { ApiResponse, CryptoMarket } from "@/types";
import { toast } from "sonner";

interface UseCryptoDataOptions {
  fresh?: boolean;
  initialCryptos?: CryptoMarket[];
  page?: number;
  refreshIntervalMs?: number;
}

interface UseCryptoDataResult {
  cryptos: CryptoMarket[];
  loading: boolean;
  lastUpdatedAt: Date | null;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

export const useCryptoData = ({
  fresh = false,
  initialCryptos = [],
  page = 1,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
}: UseCryptoDataOptions = {}): UseCryptoDataResult => {
  const hasInitialCryptos = initialCryptos.length > 0;
  const [cryptos, setCryptos] = useState<CryptoMarket[]>(initialCryptos);
  const [loading, setLoading] = useState(!hasInitialCryptos);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef<boolean>(hasInitialCryptos);

  const fetchCryptos = useCallback(async (): Promise<void> => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!hasFetchedRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        endpoint: "markets",
        page: String(page),
      });

      if (fresh) {
        params.set("fresh", "true");
      }

      const response = await fetch(`/api/crypto?${params.toString()}`, {
        cache: fresh ? "no-store" : "default",
        signal: controller.signal,
      });

      const payload = (await response.json()) as ApiResponse<CryptoMarket[]>;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Unable to fetch crypto markets");
      }

      setCryptos(payload.data ?? []);
      setLastUpdatedAt(new Date());
      hasFetchedRef.current = true;
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        return;
      }

      const message = getToastErrorMessage(
        fetchError,
        "Unable to fetch crypto markets",
      );

      setError(message);
      toast.error(message, { id: "crypto-markets-api-error" });
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [fresh, page]);

  useEffect(() => {
    const initialFetchId = hasFetchedRef.current
      ? null
      : window.setTimeout(() => {
          void fetchCryptos();
        }, 0);

    const intervalId = window.setInterval(() => {
      void fetchCryptos();
    }, refreshIntervalMs);

    return () => {
      if (initialFetchId !== null) {
        window.clearTimeout(initialFetchId);
      }
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [fetchCryptos, refreshIntervalMs]);

  return {
    cryptos,
    loading,
    lastUpdatedAt,
    error,
    refetch: fetchCryptos,
  };
};
