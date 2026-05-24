import type { Metadata } from "next";

import { NotificationToaster } from "@/components/layout/NotificationToaster";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ReduxProvider } from "@/redux/Provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoWatch",
  description: "Real-time cryptocurrency market tracking dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ReduxProvider>
            {children}
            <NotificationToaster />
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
