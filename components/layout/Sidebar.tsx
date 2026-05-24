"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, Star, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    icon: Star,
  },
  {
    href: "/dashboard/alerts",
    label: "Alerts",
    icon: Bell,
  },
];

const isActiveRoute = (pathname: string, href: string): boolean => {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-zinc-950/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200 bg-white shadow-2xl shadow-zinc-950/10 transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none dark:border-zinc-800 dark:bg-zinc-950 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20">
              CW
            </span>
            <span>
              <span className="block text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                CryptoWatch
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">Market desk</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                  active
                    ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
