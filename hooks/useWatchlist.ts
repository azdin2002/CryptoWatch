"use client";

import { useCallback, useEffect } from "react";

import { toastApiError } from "@/lib/toasts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addCryptoToWatchlist,
  fetchWatchlist,
  removeCryptoFromWatchlist,
  selectWatchlist,
  selectWatchlistError,
  selectWatchlistLoading,
} from "@/redux/slices/watchlistSlice";

interface UseWatchlistResult {
  watchlist: string[];
  loading: boolean;
  error: string | null;
  isInWatchlist: (cryptoId: string) => boolean;
  addCrypto: (cryptoId: string) => Promise<void>;
  removeCrypto: (cryptoId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useWatchlist = (): UseWatchlistResult => {
  const dispatch = useAppDispatch();
  const watchlist = useAppSelector(selectWatchlist);
  const loading = useAppSelector(selectWatchlistLoading);
  const error = useAppSelector(selectWatchlistError);

  useEffect(() => {
    void dispatch(fetchWatchlist())
      .unwrap()
      .catch((fetchError: unknown) => {
        toastApiError(
          fetchError,
          "Unable to fetch watchlist.",
          "watchlist-fetch-error",
        );
      });
  }, [dispatch]);

  const isInWatchlist = useCallback(
    (cryptoId: string): boolean =>
      watchlist.includes(cryptoId.trim().toLowerCase()),
    [watchlist],
  );

  const addCrypto = useCallback(
    async (cryptoId: string): Promise<void> => {
      await dispatch(addCryptoToWatchlist(cryptoId)).unwrap();
    },
    [dispatch],
  );

  const removeCrypto = useCallback(
    async (cryptoId: string): Promise<void> => {
      await dispatch(removeCryptoFromWatchlist(cryptoId)).unwrap();
    },
    [dispatch],
  );

  const refetch = useCallback(async (): Promise<void> => {
    await dispatch(fetchWatchlist()).unwrap();
  }, [dispatch]);

  return {
    watchlist,
    loading,
    error,
    isInWatchlist,
    addCrypto,
    removeCrypto,
    refetch,
  };
};
