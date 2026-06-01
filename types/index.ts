import type {
  CoinDetailImage,
  CoinDetailLinks,
  CoinDetailMarketData,
  CoinDetailPlatform,
  CoinMarketRoi,
  CoinStatusUpdate,
  MarketChartPoint,
} from "@/lib/coingecko";

export interface CryptoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
  roi: CoinMarketRoi | null;
  last_updated: string;
}

export interface CryptoDetail {
  id: string;
  symbol: string;
  name: string;
  web_slug: string;
  asset_platform_id: string | null;
  platforms: Record<string, string>;
  detail_platforms: Record<string, CoinDetailPlatform>;
  block_time_in_minutes: number;
  hashing_algorithm: string | null;
  categories: string[];
  preview_listing: boolean;
  public_notice: string | null;
  additional_notices: string[];
  description: Record<string, string>;
  links: CoinDetailLinks;
  image: CoinDetailImage;
  country_origin: string;
  genesis_date: string | null;
  sentiment_votes_up_percentage: number | null;
  sentiment_votes_down_percentage: number | null;
  watchlist_portfolio_users: number;
  market_cap_rank: number | null;
  market_data: CoinDetailMarketData;
  status_updates: CoinStatusUpdate[];
  last_updated: string;
}

export interface PriceHistory {
  prices: MarketChartPoint[];
  market_caps: MarketChartPoint[];
  total_volumes: MarketChartPoint[];
}

export interface GlobalMarketData {
  active_cryptocurrencies: number;
  upcoming_icos: number;
  ongoing_icos: number;
  ended_icos: number;
  markets: number;
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  updated_at: number;
}

export interface SearchCoin {
  id: string;
  name: string;
  api_symbol: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

export type AlertCondition = "above" | "below";

export interface AlertData {
  cryptoId: string;
  cryptoSymbol: string;
  cryptoName: string;
  targetPrice: number;
  condition: AlertCondition;
}

export interface AlertRecord extends AlertData {
  id: string;
  userId: string;
  active: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ProfileRecord {
  name: string;
  email: string;
}

export interface ProfileUpdateData {
  name: string;
  password?: string;
}
