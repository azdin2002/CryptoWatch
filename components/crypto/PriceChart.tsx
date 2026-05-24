"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { toast } from "sonner";

import { getToastErrorMessage } from "@/lib/toasts";
import type { ApiResponse, PriceHistory } from "@/types";

type ChartPeriod = "7" | "30" | "90" | "365";

interface PriceChartProps {
  cryptoId: string;
  cryptoName: string;
}

interface ChartPoint {
  timestamp: number;
  price: number;
}

const periods: Array<{ label: string; value: ChartPeriod }> = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "1y", value: "365" },
];

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

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const monthDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const getDateLabel = (timestamp: number, period: ChartPeriod): string => {
  const date = new Date(timestamp);

  if (period === "365") {
    return monthDateFormatter.format(date);
  }

  return shortDateFormatter.format(date);
};

const formatPrice = (value: number): string => currencyFormatter.format(value);

const formatAxisPrice = (value: number): string =>
  compactCurrencyFormatter.format(value);

const mapChartData = (history: PriceHistory): ChartPoint[] =>
  history.prices
    .filter(
      (point): point is [number, number] =>
        Array.isArray(point) &&
        point.length === 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1]),
    )
    .map(([timestamp, price]) => ({
      timestamp,
      price,
    }));

const ChartTooltip = ({
  active,
  label,
  payload,
}: TooltipContentProps) => {
  const value = payload[0]?.value;
  const price = typeof value === "number" ? value : Number(value);
  const timestamp = typeof label === "number" ? label : Number(label);

  if (!active || !Number.isFinite(price) || !Number.isFinite(timestamp)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-zinc-950">{formatPrice(price)}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {tooltipDateFormatter.format(new Date(timestamp))}
      </p>
    </div>
  );
};

export const PriceChart = ({ cryptoId, cryptoName }: PriceChartProps) => {
  const [period, setPeriod] = useState<ChartPeriod>("7");
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const normalizedCryptoId = cryptoId.trim().toLowerCase();
    const requestKey = `${normalizedCryptoId}:${period}`;

    if (!normalizedCryptoId || activeRequestKeyRef.current === requestKey) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeRequestKeyRef.current = requestKey;

    const fetchChartData = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          endpoint: "chart",
          id: normalizedCryptoId,
          days: period,
        });
        const response = await fetch(`/api/crypto?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as ApiResponse<PriceHistory>;

        if (!response.ok || payload.error || !payload.data) {
          throw new Error(payload.error ?? "Unable to load chart data.");
        }

        setPoints(mapChartData(payload.data));
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setPoints([]);
        const message = getToastErrorMessage(
          fetchError,
          "Unable to load chart data.",
        );
        setError(message);
        toast.error(message, {
          id: `chart-api-error-${normalizedCryptoId}-${period}`,
        });
      } finally {
        if (activeRequestKeyRef.current === requestKey) {
          activeRequestKeyRef.current = null;
          setLoading(false);
        }
      }
    };

    void fetchChartData();

    return () => {
      controller.abort();
      if (activeRequestKeyRef.current === requestKey) {
        activeRequestKeyRef.current = null;
      }
    };
  }, [cryptoId, period]);

  const chartDomain = useMemo<[number | "auto", number | "auto"]>(() => {
    if (points.length === 0) {
      return ["auto", "auto"];
    }

    const prices = points.map((point) => point.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.08;

    return [Math.max(0, min - padding), max + padding];
  }, [points]);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Price history</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950">
            {cryptoName} USD chart
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-2 rounded-lg bg-zinc-100 p-1">
          {periods.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              disabled={loading && period === item.value}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                period === item.value
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-600 hover:bg-white/70 hover:text-zinc-950"
              }`}
              aria-pressed={period === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-72 sm:h-80">
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-600">
            Loading chart data...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-sm text-red-700">
            {error}
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg bg-zinc-50 px-4 text-center text-sm text-zinc-600">
            No historical price data is available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
            >
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                minTickGap={28}
                tickFormatter={(value: number) => getDateLabel(value, period)}
                stroke="#71717a"
                fontSize={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={12}
                width={72}
                domain={chartDomain}
                tickFormatter={formatAxisPrice}
                stroke="#71717a"
                fontSize={12}
              />
              <Tooltip
                cursor={{ stroke: "#d4d4d8", strokeWidth: 1 }}
                content={(props: TooltipContentProps) => <ChartTooltip {...props} />}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#059669" }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default PriceChart;
