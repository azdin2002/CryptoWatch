import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BarChart3, LineChart, TrendingUp, Wallet } from "lucide-react";

import { PriceAlertForm } from "@/components/crypto/PriceAlertForm";
import { PriceChart } from "@/components/crypto/PriceChart";
import { WatchlistButton } from "@/components/crypto/WatchlistButton";
import { CoinGeckoApiError, getCoinDetail } from "@/lib/coingecko";
import type { CryptoDetail } from "@/types";

interface CryptoDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatCurrency = (value: number | undefined): string =>
  typeof value === "number" ? currencyFormatter.format(value) : "N/A";

const formatCompactCurrency = (value: number | undefined): string =>
  typeof value === "number" ? compactCurrencyFormatter.format(value) : "N/A";

const formatPercentage = (value: number | null | undefined): string =>
  typeof value === "number" ? `${percentFormatter.format(value)}%` : "N/A";

const getChangeClassName = (value: number | null | undefined): string => {
  if (typeof value !== "number") {
    return "text-zinc-600 dark:text-zinc-400";
  }

  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
};

const getCryptoDetail = async (id: string): Promise<CryptoDetail> => {
  try {
    return await getCoinDetail(id, { revalidate: 60 });
  } catch (error) {
    if (error instanceof CoinGeckoApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
};

export const generateMetadata = async ({
  params,
}: CryptoDetailPageProps): Promise<Metadata> => {
  const { id } = await params;

  try {
    const crypto = await getCryptoDetail(id);

    return {
      title: `${crypto.name} (${crypto.symbol.toUpperCase()}) | CryptoWatch`,
      description: `Track ${crypto.name} price, market cap, volume, and historical chart data on CryptoWatch.`,
    };
  } catch {
    return {
      title: "Crypto not found | CryptoWatch",
    };
  }
};

export default async function CryptoDetailPage({
  params,
}: CryptoDetailPageProps) {
  const { id } = await params;
  const crypto = await getCryptoDetail(id);
  const marketData = crypto.market_data;
  const description = stripHtml(crypto.description.en ?? "");
  const price = marketData.current_price.usd;
  const marketCap = marketData.market_cap.usd;
  const volume = marketData.total_volume.usd;
  const change24h = marketData.price_change_percentage_24h;
  const change7d = marketData.price_change_percentage_7d;
  const metrics = [
    {
      label: "Market Cap",
      value: formatCompactCurrency(marketCap),
      icon: Wallet,
      valueClassName: "text-zinc-950 dark:text-zinc-50",
    },
    {
      label: "24h Change",
      value: formatPercentage(change24h),
      icon: TrendingUp,
      valueClassName: getChangeClassName(change24h),
    },
    {
      label: "7d Change",
      value: formatPercentage(change7d),
      icon: LineChart,
      valueClassName: getChangeClassName(change7d),
    },
    {
      label: "24h Volume",
      value: formatCompactCurrency(volume),
      icon: BarChart3,
      valueClassName: "text-zinc-950 dark:text-zinc-50",
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/25 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Image
            src={crypto.image.large}
            alt={`${crypto.name} logo`}
            width={88}
            height={88}
            priority
            className="h-20 w-20 rounded-full shadow-lg shadow-zinc-950/10 ring-4 ring-white dark:ring-zinc-800 sm:h-22 sm:w-22"
          />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {crypto.name}
              </h1>
              <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-sm font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {crypto.symbol}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold">
              {formatCurrency(price)}
            </p>
            {crypto.market_cap_rank ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Market rank #{crypto.market_cap_rank}
              </p>
            ) : null}
          </div>
        </div>
        <WatchlistButton cryptoId={crypto.id} />
      </div>

      <section
        aria-label={`${crypto.name} market metrics`}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="group rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-lg shadow-zinc-200/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/20"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {metric.label}
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-transform duration-200 group-hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className={`mt-3 text-2xl font-semibold ${metric.valueClassName}`}>
                {metric.value}
              </p>
            </div>
          );
        })}
      </section>

      <PriceChart cryptoId={crypto.id} cryptoName={crypto.name} />

      <PriceAlertForm
        cryptoId={crypto.id}
        cryptoSymbol={crypto.symbol}
        cryptoName={crypto.name}
        currentPrice={price}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/25 sm:p-6">
        <h2 className="text-xl font-semibold">About {crypto.name}</h2>
        {description ? (
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-700 dark:text-zinc-300 sm:text-base">
            {description}
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No description is available from CoinGecko for this asset.
          </p>
        )}
      </section>
    </>
  );
}
