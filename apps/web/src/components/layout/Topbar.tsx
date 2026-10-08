"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

type TopbarProps = {
  onMenuClick?: () => void;
};

const pageNames: Record<string, string> = {
  "/": "Research",
  "/library": "Library",
  "/papers": "Papers",
  "/datasets": "Datasets",
  "/projects": "Projects",
  "/planner": "Planner",
  "/pulse": "Research Pulse",
  "/account": "Account",
  "/my-research": "My Research",
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const pathname = usePathname();

  const pageName =
    pageNames[pathname] ??
    Object.entries(pageNames).find(
      ([path]) =>
        path !== "/" &&
        pathname.startsWith(path),
    )?.[1] ??
    "Research";

  return (
    <header
      className="
        sticky top-0 z-20
        flex h-[60px]
        items-center
        border-b border-white/[0.06]
        bg-[#08090c]/90
        px-4
        backdrop-blur-xl
        sm:h-[64px]
        sm:px-6
        lg:px-8
      "
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-lg
            text-[#858994]
            transition-colors
            hover:bg-white/[0.05]
            hover:text-white
            md:hidden
          "
        >
          <Menu
            size={19}
            strokeWidth={1.7}
          />
        </button>

        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-[#555a64] sm:inline">
            Workspace
          </span>

          <span className="hidden text-[#373a42] sm:inline">
            /
          </span>

          <span className="truncate text-[#c9cbd0]">
            {pageName}
          </span>
        </div>
      </div>
    </header>
  );
}