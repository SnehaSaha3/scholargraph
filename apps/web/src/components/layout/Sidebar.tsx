"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  FolderKanban,
  Library,
  Search,
  Sparkles,
  X,
} from "lucide-react";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
};

const navigation = [
  {
    label: "Research",
    href: "/",
    icon: Search,
  },
  {
    label: "Library",
    href: "/library",
    icon: Library,
  },
  {
    label: "Papers",
    href: "/papers",
    icon: FileText,
  },
  {
    label: "Datasets",
    href: "/datasets",
    icon: Database,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Planner",
    href: "/planner",
    icon: CalendarDays,
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#0a0b0f]/95 backdrop-blur-xl transition-all duration-300",
        collapsed
          ? "w-[76px]"
          : "w-[260px]",
        mobileOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* BRAND */}
      <div
        className={[
          "flex h-[72px] shrink-0 items-center border-b border-white/[0.07]",
          collapsed
            ? "justify-center px-3"
            : "justify-between px-5",
        ].join(" ")}
      >
        <Link
          href="/"
          onClick={onMobileClose}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[0.08]">
            <Sparkles
              size={18}
              className="text-violet-200"
            />
          </div>

          {!collapsed && (
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-white">
                ScholarGraph
              </p>

              <p className="mt-0.5 text-[10px] text-white/30">
                Research workspace
              </p>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.05] hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p
          className={[
            "mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25",
            collapsed ? "sr-only" : "",
          ].join(" ")}
        >
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                title={
                  collapsed
                    ? item.label
                    : undefined
                }
                className={[
                  "group relative flex min-h-11 items-center rounded-xl transition",
                  collapsed
                    ? "justify-center px-2"
                    : "gap-3 px-3",
                  isActive
                    ? "bg-white/[0.075] text-white"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-300" />
                )}

                <Icon
                  size={18}
                  className={
                    isActive
                      ? "text-violet-200"
                      : "text-white/35 group-hover:text-white/60"
                  }
                />

                {!collapsed && (
                  <span className="text-[13px] font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <div className="mt-7">
            <p className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25">
              Discover
            </p>

            <Link
              href="/pulse"
              onClick={onMobileClose}
              className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-white/40 transition hover:bg-white/[0.04] hover:text-white/80"
            >
              <Activity
                size={18}
                className="text-white/30 group-hover:text-white/60"
              />

              <span className="text-[13px] font-medium">
                Research Pulse
              </span>
            </Link>
          </div>
        )}
      </nav>

      {/* FOOTER */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <Link
          href="/my-research"
          onClick={onMobileClose}
          title={
            collapsed
              ? "My Research"
              : undefined
          }
          className={[
            "flex min-h-11 items-center rounded-xl text-white/40 transition hover:bg-white/[0.04] hover:text-white/80",
            collapsed
              ? "justify-center"
              : "gap-3 px-3",
          ].join(" ")}
        >
          <Bookmark size={18} />

          {!collapsed && (
            <div>
              <p className="text-[13px] font-medium">
                My Research
              </p>

              <p className="mt-0.5 text-[10px] text-white/25">
                Saved work & resources
              </p>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          className={[
            "mt-2 flex h-9 w-full items-center rounded-lg text-white/25 transition hover:bg-white/[0.04] hover:text-white/60",
            collapsed
              ? "justify-center"
              : "justify-end px-2",
          ].join(" ")}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}