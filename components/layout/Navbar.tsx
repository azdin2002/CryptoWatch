"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SearchBar } from "@/components/SearchBar";

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
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white lg:hidden">
            CW
          </span>
          <span className="hidden text-base font-semibold text-zinc-950 sm:block lg:text-lg">
            CryptoWatch
          </span>
        </Link>

        <div className="mx-auto hidden w-full max-w-2xl md:block">
          <SearchBar />
        </div>

        <div ref={menuRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setUserMenuOpen((current) => !current)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-zinc-50"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
              {getInitials(user.name)}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-sm font-medium text-zinc-950">
                {user.name}
              </span>
              {user.email ? (
                <span className="block max-w-36 truncate text-xs text-zinc-500">
                  {user.email}
                </span>
              ) : null}
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          </button>

          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
            >
              <div className="border-b border-zinc-100 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
                  <User className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  <span className="truncate">{user.name}</span>
                </div>
                {user.email ? (
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {user.email}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-4 py-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
};

export default Navbar;
