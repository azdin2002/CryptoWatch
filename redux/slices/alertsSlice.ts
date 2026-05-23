import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import type { RootState } from "@/redux/store";
import type { AlertData, AlertRecord, ApiResponse } from "@/types";

interface DeleteAlertResponse {
  id: string;
}

interface AlertsState {
  alerts: AlertRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  alerts: [],
  loading: false,
  error: null,
};

const readApiResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(payload.error ?? "Unable to process alerts.");
  }

  return payload.data;
};

export const fetchAlerts = createAsyncThunk<
  AlertRecord[],
  void,
  { rejectValue: string }
>("alerts/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/alerts");
    return await readApiResponse<AlertRecord[]>(response);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to fetch alerts.",
    );
  }
});

export const createAlert = createAsyncThunk<
  AlertRecord,
  AlertData,
  { rejectValue: string }
>("alerts/create", async (alertData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alertData),
    });

    return await readApiResponse<AlertRecord>(response);
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to create alert.",
    );
  }
});

export const deleteAlert = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("alerts/delete", async (alertId, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `/api/alerts?id=${encodeURIComponent(alertId)}`,
      {
        method: "DELETE",
      },
    );
    const data = await readApiResponse<DeleteAlertResponse>(response);

    return data.id;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to delete alert.",
    );
  }
});

const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    clearAlertsError(state) {
      state.error = null;
    },
    setAlerts(state, action: PayloadAction<AlertRecord[]>) {
      state.alerts = action.payload;
      state.error = null;
    },
    addAlert(state, action: PayloadAction<AlertRecord>) {
      state.alerts.unshift(action.payload);
      state.error = null;
    },
    removeAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter(
        (alert) => alert.id !== action.payload,
      );
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to fetch alerts.";
      })
      .addCase(createAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts.unshift(action.payload);
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to create alert.";
      })
      .addCase(deleteAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = state.alerts.filter(
          (alert) => alert.id !== action.payload,
        );
      })
      .addCase(deleteAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to delete alert.";
      });
  },
});

export const { addAlert, clearAlertsError, removeAlert, setAlerts } =
  alertsSlice.actions;

export const selectAlerts = (state: RootState): AlertRecord[] =>
  state.alerts.alerts;

export const selectActiveAlerts = createSelector(
  [selectAlerts],
  (alerts): AlertRecord[] => alerts.filter((alert) => alert.active),
);

export const selectAlertsLoading = (state: RootState): boolean =>
  state.alerts.loading;

export const selectAlertsError = (state: RootState): string | null =>
  state.alerts.error;

export default alertsSlice.reducer;
