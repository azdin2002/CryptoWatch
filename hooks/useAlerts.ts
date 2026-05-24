"use client";

import { useCallback, useEffect } from "react";

import { toastApiError } from "@/lib/toasts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createAlert,
  deleteAlert,
  fetchAlerts,
  selectActiveAlerts,
  selectAlerts,
  selectAlertsError,
  selectAlertsLoading,
} from "@/redux/slices/alertsSlice";
import type { AlertData, AlertRecord } from "@/types";

interface UseAlertsResult {
  alerts: AlertRecord[];
  activeAlerts: AlertRecord[];
  loading: boolean;
  error: string | null;
  createPriceAlert: (alertData: AlertData) => Promise<AlertRecord>;
  removePriceAlert: (alertId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAlerts = (): UseAlertsResult => {
  const dispatch = useAppDispatch();
  const alerts = useAppSelector(selectAlerts);
  const activeAlerts = useAppSelector(selectActiveAlerts);
  const loading = useAppSelector(selectAlertsLoading);
  const error = useAppSelector(selectAlertsError);

  useEffect(() => {
    void dispatch(fetchAlerts())
      .unwrap()
      .catch((fetchError: unknown) => {
        toastApiError(
          fetchError,
          "Unable to fetch alerts.",
          "alerts-fetch-error",
        );
      });
  }, [dispatch]);

  const createPriceAlert = useCallback(
    async (alertData: AlertData): Promise<AlertRecord> =>
      dispatch(createAlert(alertData)).unwrap(),
    [dispatch],
  );

  const removePriceAlert = useCallback(
    async (alertId: string): Promise<void> => {
      await dispatch(deleteAlert(alertId)).unwrap();
    },
    [dispatch],
  );

  const refetch = useCallback(async (): Promise<void> => {
    await dispatch(fetchAlerts()).unwrap();
  }, [dispatch]);

  return {
    alerts,
    activeAlerts,
    loading,
    error,
    createPriceAlert,
    removePriceAlert,
    refetch,
  };
};
