"use client";

import { ReactNode, useState } from "react";

import { Navbar } from "@/components/layout/Navbar";
import type { NavbarUser } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  user: NavbarUser;
}

export const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32rem),linear-gradient(180deg,#f8fafc,#f4f4f5)] text-zinc-950 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30rem),linear-gradient(180deg,#05070c,#09090b)] dark:text-zinc-50">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar user={user} onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
