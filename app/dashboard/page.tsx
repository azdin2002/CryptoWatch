import { AlertsList } from "@/components/alerts/AlertsList";
import { SearchBar } from "@/components/SearchBar";
import { CryptoTable } from "@/components/crypto/CryptoTable";
import {
  CoinGeckoApiError,
  getGlobalStats,
  getMarkets,
} from "@/lib/coingecko";
import type { CryptoMarket, GlobalMarketData } from "@/types";

interface DashboardData {
  cryptos: CryptoMarket[];
  stats: GlobalMarketData;
}

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

const formatCompactCurrency = (value: number | undefined): string =>
  typeof value === "number" ? compactCurrencyFormatter.format(value) : "N/A";

const formatPercentage = (value: number | undefined): string =>
  typeof value === "number" ? `${percentFormatter.format(value)}%` : "N/A";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof CoinGeckoApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load market data";
};

const DashboardError = ({ message }: { message: string }) => (
  <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {message}
      </div>
    </div>
  </main>
);

const getDashboardData = async (): Promise<DashboardData> => {
  const [cryptos, globalStats] = await Promise.all([
    getMarkets(1, { revalidate: 60 }),
    getGlobalStats({ revalidate: 60 }),
  ]);

  return {
    cryptos,
    stats: globalStats.data,
  };
};

export default async function DashboardPage() {
  let dashboardData: DashboardData;

  try {
    dashboardData = await getDashboardData();
  } catch (error) {
    return <DashboardError message={getErrorMessage(error)} />;
  }

  const { cryptos, stats } = dashboardData;
  const btcDominance = stats.market_cap_percentage.btc;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              CryptoWatch
            </p>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Market Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                Live cryptocurrency market overview powered by CoinGecko.
              </p>
            </div>
          </div>
          <SearchBar />
        </header>

        <section
          aria-label="Market overview"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Total Market Cap</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCompactCurrency(stats.total_market_cap.usd)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">24h Volume</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCompactCurrency(stats.total_volume.usd)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">BTC Dominance</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPercentage(btcDominance)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Active Cryptos</p>
            <p className="mt-2 text-2xl font-semibold">
              {stats.active_cryptocurrencies.toLocaleString("en-US")}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">Top Cryptocurrencies</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sorted by market capitalization.
            </p>
          </div>
          <CryptoTable cryptos={cryptos} />
        </section>

        <AlertsList />
      </div>
    </main>
  );
}
