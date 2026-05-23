"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiResponse, CryptoMarket } from "@/types";

interface UseCryptoDataOptions {
  page?: number;
  refreshIntervalMs?: number;
}

interface UseCryptoDataResult {
  cryptos: CryptoMarket[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_REFRESH_INTERVAL_MS = 30_000;

export const useCryptoData = ({
  page = 1,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
}: UseCryptoDataOptions = {}): UseCryptoDataResult => {
  const [cryptos, setCryptos] = useState<CryptoMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCryptos = useCallback(async (): Promise<void> => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        endpoint: "markets",
        page: String(page),
      });

      const response = await fetch(`/api/crypto?${params.toString()}`, {
        signal: controller.signal,
      });

      const payload = (await response.json()) as ApiResponse<CryptoMarket[]>;

      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Unable to fetch crypto markets");
      }

      setCryptos(payload.data ?? []);
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
          : "Unable to fetch crypto markets",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [page]);

  useEffect(() => {
    const initialFetchId = window.setTimeout(() => {
      void fetchCryptos();
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchCryptos();
    }, refreshIntervalMs);

    return () => {
      window.clearTimeout(initialFetchId);
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [fetchCryptos, refreshIntervalMs]);

  return {
    cryptos,
    loading,
    error,
    refetch: fetchCryptos,
  };
};
