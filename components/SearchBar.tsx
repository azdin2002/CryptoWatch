"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";

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
  const [error, setError] = useState<string | null>(null);
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
      setError(null);

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
          setOpen(true);
          setError(
            searchError instanceof Error
              ? searchError.message
              : "Unable to search cryptos.",
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

  const showDropdown = open && (query.trim() || loading || error);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <label htmlFor="crypto-search" className="sr-only">
        Search cryptocurrencies
      </label>
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
            setError(null);
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
        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />

      {showDropdown ? (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-zinc-600">Searching...</div>
          ) : error ? (
            <div className="px-4 py-3 text-sm text-red-700">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-600">
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
                      activeIndex === index ? "bg-zinc-100" : "hover:bg-zinc-50"
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
                      <span className="block truncate text-sm font-medium text-zinc-950">
                        {result.name}
                      </span>
                      <span className="block text-xs uppercase text-zinc-500">
                        {result.symbol}
                      </span>
                    </span>
                    {result.market_cap_rank ? (
                      <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
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
