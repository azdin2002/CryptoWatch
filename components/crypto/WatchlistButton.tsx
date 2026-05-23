"use client";

import { useState } from "react";

import { useWatchlist } from "@/hooks/useWatchlist";

interface WatchlistButtonProps {
  cryptoId: string;
}

export const WatchlistButton = ({ cryptoId }: WatchlistButtonProps) => {
  const normalizedCryptoId = cryptoId.trim().toLowerCase();
  const { loading, error, isInWatchlist, addCrypto, removeCrypto } =
    useWatchlist();
  const [syncing, setSyncing] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const saved = isInWatchlist(normalizedCryptoId);

  const handleToggle = async (): Promise<void> => {
    if (loading || syncing || !normalizedCryptoId) {
      return;
    }

    setSyncing(true);
    setLocalError(null);

    try {
      if (saved) {
        await removeCrypto(normalizedCryptoId);
      } else {
        await addCrypto(normalizedCryptoId);
      }
    } catch (toggleError) {
      setLocalError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update watchlist.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          void handleToggle();
        }}
        disabled={loading || syncing}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          saved
            ? "border border-zinc-300 bg-white text-zinc-800 hover:bg-red-50 hover:text-red-700"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {syncing ? "Saving..." : saved ? "Remove from watchlist" : "Add to watchlist"}
      </button>
      {localError || error ? (
        <p className="text-sm text-red-600">{localError ?? error}</p>
      ) : null}
    </div>
  );
};

export default WatchlistButton;
