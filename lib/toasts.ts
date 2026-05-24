"use client";

import { toast } from "sonner";

export const getToastErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const toastApiError = (
  error: unknown,
  fallback: string,
  id?: string,
): void => {
  toast.error(getToastErrorMessage(error, fallback), { id });
};
