"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export interface NavbarUser {
  name: string;
  email?: string | null;
}

interface NavbarProps {
  user: NavbarUser;
  onMenuClick: () => void;
}

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "U";
};

export const Navbar = ({ user, onMenuClick }: NavbarProps) => {
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/85 shadow-sm shadow-zinc-200/40 backdrop-blur-xl transition-colors duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-black/20">
      <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-zinc-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:ring-offset-zinc-950"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 lg:hidden">
            CW
          </span>
          <span className="hidden text-base font-semibold text-zinc-950 transition-colors dark:text-zinc-50 sm:block lg:text-lg">
            CryptoWatch
          </span>
        </Link>

        <div className="mx-auto hidden w-full max-w-2xl md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((current) => !current)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs font-semibold text-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-100">
              {getInitials(user.name)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {user.name}
              </span>
              {user.email ? (
                <span className="block max-w-36 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </span>
              ) : null}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform duration-200 dark:text-zinc-400" aria-hidden="true" />
          </button>

          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30"
            >
              <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                  <span className="truncate">{user.name}</span>
                </div>
                {user.email ? (
                  <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                ) : null}
              </div>
              <Link
                href="/dashboard/profile"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-4 py-3 md:hidden dark:border-zinc-800">
        <SearchBar />
      </div>
    </header>
  );
};

export default Navbar;
