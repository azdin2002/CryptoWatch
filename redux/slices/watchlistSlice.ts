import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from "@/redux/store";
import type { ApiResponse } from "@/types";

interface WatchlistData {
  cryptos: string[];
}

interface WatchlistState {
  cryptos: string[];
  loading: boolean;
  error: string | null;
}

const initialState: WatchlistState = {
  cryptos: [],
  loading: false,
  error: null,
};

const requestWatchlist = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<WatchlistData> => {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiResponse<WatchlistData>;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(payload.error ?? "Unable to update watchlist.");
  }

  return payload.data;
};

export const fetchWatchlist = createAsyncThunk<
  WatchlistData,
  void,
  { rejectValue: string }
>("watchlist/fetch", async (_, { rejectWithValue }) => {
  try {
    return await requestWatchlist("/api/watchlist");
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to fetch watchlist.",
    );
  }
});

export const addCryptoToWatchlist = createAsyncThunk<
  WatchlistData,
  string,
  { rejectValue: string }
>("watchlist/addCrypto", async (cryptoId, { rejectWithValue }) => {
  try {
    return await requestWatchlist("/api/watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cryptoId }),
    });
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to add crypto.",
    );
  }
});

export const removeCryptoFromWatchlist = createAsyncThunk<
  WatchlistData,
  string,
  { rejectValue: string }
>("watchlist/removeCrypto", async (cryptoId, { rejectWithValue }) => {
  try {
    return await requestWatchlist("/api/watchlist", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cryptoId }),
    });
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to remove crypto.",
    );
  }
});

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    clearWatchlistError(state) {
      state.error = null;
    },
    setWatchlist(state, action: PayloadAction<string[]>) {
      state.cryptos = action.payload;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.cryptos = action.payload.cryptos;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to fetch watchlist.";
      })
      .addCase(addCryptoToWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCryptoToWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.cryptos = action.payload.cryptos;
      })
      .addCase(addCryptoToWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to add crypto.";
      })
      .addCase(removeCryptoFromWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCryptoFromWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.cryptos = action.payload.cryptos;
      })
      .addCase(removeCryptoFromWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to remove crypto.";
      });
  },
});

export const { clearWatchlistError, setWatchlist } = watchlistSlice.actions;

export const selectWatchlist = (state: RootState): string[] =>
  state.watchlist.cryptos;

export const selectWatchlistLoading = (state: RootState): boolean =>
  state.watchlist.loading;

export const selectWatchlistError = (state: RootState): string | null =>
  state.watchlist.error;

export const selectIsInWatchlist =
  (cryptoId: string) =>
  (state: RootState): boolean =>
    state.watchlist.cryptos.includes(cryptoId);

export default watchlistSlice.reducer;

