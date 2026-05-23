import { configureStore } from "@reduxjs/toolkit";

import alertsReducer from "@/redux/slices/alertsSlice";
import watchlistReducer from "@/redux/slices/watchlistSlice";

export const store = configureStore({
  reducer: {
    alerts: alertsReducer,
    watchlist: watchlistReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
