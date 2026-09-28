"use client";

import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

type TopbarProps = {
  onMenuClick?: () => void;
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[64px] items-center border-b border-white/[0.07] bg-[#08090c]/90 px-4 backdrop-blur-xl sm:h-[72px] sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#858994] transition-colors hover:bg-white/[0.05] hover:text-white md:hidden"
        >
          <Menu
            size={19}
            strokeWidth={1.7}
          />
        </button>

        {/* Breadcrumb */}
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-[#555963] sm:inline">
            Workspace
          </span>

          <span className="hidden text-[#3c3f46] sm:inline">
            /
          </span>

          <span className="truncate text-[#c9cbd0]">
            Research
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 text-xs text-[#777b85] transition-colors hover:bg-white/[0.05] hover:text-[#bfc1c7] sm:flex"
        >
          <Search
            size={14}
            strokeWidth={1.7}
          />

          <span>Search</span>

          <kbd className="ml-2 rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-[#555963]">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777b85] transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          <Bell
            size={17}
            strokeWidth={1.7}
          />
        </button>

        <button
          type="button"
          aria-label="Profile"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-medium text-[#d5d6da]"
        >
          S
        </button>
      </div>
    </header>
  );
}