"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { useWatchlist } from "@/hooks/useWatchlist";
import { getToastErrorMessage } from "@/lib/toasts";

interface WatchlistButtonProps {
  cryptoId: string;
}

export const WatchlistButton = ({ cryptoId }: WatchlistButtonProps) => {
  const normalizedCryptoId = cryptoId.trim().toLowerCase();
  const { loading, isInWatchlist, addCrypto, removeCrypto } = useWatchlist();
  const [syncing, setSyncing] = useState<boolean>(false);
  const saved = isInWatchlist(normalizedCryptoId);

  const handleToggle = async (): Promise<void> => {
    if (loading || syncing || !normalizedCryptoId) {
      return;
    }

    setSyncing(true);

    try {
      if (saved) {
        await removeCrypto(normalizedCryptoId);
        toast.success("Removed from watchlist.");
      } else {
        await addCrypto(normalizedCryptoId);
        toast.success("Added to watchlist.");
      }
    } catch (toggleError) {
      toast.error(
        getToastErrorMessage(toggleError, "Unable to update watchlist."),
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 ${
          saved
            ? "border border-zinc-300 bg-white text-zinc-800 hover:bg-red-50 hover:text-red-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-red-950/30 dark:hover:text-red-300"
            : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
        }`}
      >
        {saved ? (
          <Minus className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Plus className="h-4 w-4" aria-hidden="true" />
        )}
        {syncing ? "Saving..." : saved ? "Remove from watchlist" : "Add to watchlist"}
      </button>
    </div>
  );
};

export default WatchlistButton;
