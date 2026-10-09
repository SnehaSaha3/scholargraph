
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  Search,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, loading, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await signOut();
    } catch {
      // The local UI is cleared even if the server request fails.
    } finally {
      setProfileOpen(false);
      setSigningOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  const displayName = user?.display_name?.trim() || "Researcher";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-white/[0.07] bg-[#08090c]/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex w-full items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/60 hover:bg-white/[0.05] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div className="relative max-w-xl flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
          />

          <input
            type="search"
            placeholder="Search research, papers, datasets..."
            aria-label="Search research, papers and datasets"
            className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-10 pr-16 text-sm text-white outline-none placeholder:text-white/25 transition focus:border-white/[0.14] focus:bg-white/[0.035]"
          />

          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/25 sm:block">
            ⌘ K
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.04] hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          <div className="hidden h-7 w-px bg-white/[0.07] sm:block" />

          {loading ? (
            <div
              className="h-9 w-24 animate-pulse rounded-xl bg-white/[0.04]"
              aria-label="Loading account"
            />
          ) : user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open account menu"
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-white/[0.04]"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-violet-300/20 bg-violet-300/[0.08] text-sm font-medium text-violet-100">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </span>

                <span className="hidden max-w-32 truncate text-sm text-white/70 md:block">
                  {displayName}
                </span>

                <ChevronDown
                  size={14}
                  className="text-white/35"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/[0.09] bg-[#101116] p-2 shadow-xl">
                  <div className="border-b border-white/[0.07] px-3 py-3">
                    <p className="truncate text-sm font-medium text-white">
                      {displayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/40">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-sm text-white/65 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 text-sm text-white/75 transition hover:bg-white/[0.07] hover:text-white"
            >
              <LogIn size={16} />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}