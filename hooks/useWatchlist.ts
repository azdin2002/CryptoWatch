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
  selectWatchlistHydrated,
  selectWatchlistLoading,
} from "@/redux/slices/watchlistSlice";

interface UseWatchlistResult {
  watchlist: string[];
  loading: boolean;
  hydrated: boolean;
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
  const hydrated = useAppSelector(selectWatchlistHydrated);
  const error = useAppSelector(selectWatchlistError);

  useEffect(() => {
    if (hydrated || loading) {
      return;
    }

    void dispatch(fetchWatchlist()).then((action) => {
      if (fetchWatchlist.rejected.match(action) && !action.meta.condition) {
        toastApiError(
          action.payload ?? action.error.message,
          "Unable to fetch watchlist.",
          "watchlist-fetch-error",
        );
      }
    });
  }, [dispatch, hydrated, loading]);

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
    await dispatch(fetchWatchlist({ force: true })).unwrap();
  }, [dispatch]);

  return {
    watchlist,
    loading,
    hydrated,
    error,
    isInWatchlist,
    addCrypto,
    removeCrypto,
    refetch,
  };
};
