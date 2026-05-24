"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import { toast } from "sonner";

import { getToastErrorMessage } from "@/lib/toasts";
import type { ApiResponse, SearchCoin } from "@/types";

const MAX_RESULTS = 8;
const DEBOUNCE_MS = 400;

const useDebouncedValue = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState<string>(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
};

export const SearchBar = () => {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestedQueryRef = useRef<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchCoin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      if (
        wrapperRef.current &&
        event.target instanceof Node &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      abortControllerRef.current?.abort();
      lastRequestedQueryRef.current = null;
      return;
    }

    if (lastRequestedQueryRef.current === trimmedQuery) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    lastRequestedQueryRef.current = trimmedQuery;

    const fetchResults = async (): Promise<void> => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          endpoint: "search",
          q: trimmedQuery,
        });
        const response = await fetch(`/api/crypto?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as ApiResponse<SearchCoin[]>;

        if (!response.ok || payload.error || !payload.data) {
          throw new Error(payload.error ?? "Unable to search cryptos.");
        }

        setResults(payload.data.slice(0, MAX_RESULTS));
        setOpen(true);
        setActiveIndex(-1);
      } catch (searchError) {
        if (
          searchError instanceof DOMException &&
          searchError.name === "AbortError"
        ) {
          return;
        }

        if (abortControllerRef.current === controller) {
          setResults([]);
          setOpen(false);
          toast.error(
            getToastErrorMessage(searchError, "Unable to search cryptos."),
            { id: "crypto-search-api-error" },
          );
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    };

    void fetchResults();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  const navigateToCrypto = useCallback(
    (cryptoId: string): void => {
      setOpen(false);
      setActiveIndex(-1);
      setQuery("");
      router.push(`/dashboard/crypto/${encodeURIComponent(cryptoId)}`);
    },
    [router],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0 ? -1 : Math.min(current + 1, results.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0 ? -1 : Math.max(current - 1, 0),
      );
      return;
    }

    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      const selectedResult = results[activeIndex >= 0 ? activeIndex : 0];

      if (selectedResult) {
        navigateToCrypto(selectedResult.id);
      }
    }
  };

  const showDropdown = open && (query.trim() || loading);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <label htmlFor="crypto-search" className="sr-only">
        Search cryptocurrencies
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id="crypto-search"
        type="search"
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setOpen(true);

          if (!nextQuery.trim()) {
            setResults([]);
            setLoading(false);
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        onFocus={() => {
          if (query.trim() || results.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={Boolean(showDropdown)}
        aria-controls="crypto-search-results"
        aria-activedescendant={
          activeIndex >= 0 ? `crypto-search-result-${activeIndex}` : undefined
        }
        autoComplete="off"
        placeholder="Search crypto by name or symbol"
        className="h-11 w-full rounded-xl border border-zinc-300 bg-white/95 px-4 py-3 pl-10 text-sm text-zinc-950 shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-emerald-600 dark:focus:ring-emerald-950"
      />

      {showDropdown ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30">
          {loading ? (
            <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
              No matching cryptocurrencies found.
            </div>
          ) : (
            <ul
              id="crypto-search-results"
              role="listbox"
              className="max-h-96 overflow-y-auto py-1"
            >
              {results.map((result, index) => (
                <li
                  key={result.id}
                  id={`crypto-search-result-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateToCrypto(result.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeIndex === index
                        ? "bg-emerald-50 dark:bg-emerald-950/30"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Image
                      src={result.thumb}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {result.name}
                      </span>
                      <span className="block text-xs uppercase text-zinc-500 dark:text-zinc-400">
                        {result.symbol}
                      </span>
                    </span>
                    {result.market_cap_rank ? (
                      <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        #{result.market_cap_rank}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchBar;
