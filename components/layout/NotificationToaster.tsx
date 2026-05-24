"use client";

import { Toaster } from "sonner";

export const NotificationToaster = () => (
  <Toaster
    closeButton
    position="top-right"
    richColors
    theme="system"
    toastOptions={{
      classNames: {
        toast:
          "border-zinc-200 bg-white text-zinc-950 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
        description: "text-zinc-600 dark:text-zinc-400",
        closeButton:
          "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
      },
    }}
  />
);

export default NotificationToaster;
