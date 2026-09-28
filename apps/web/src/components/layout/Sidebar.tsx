"use client";

import {
  Activity,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  FolderKanban,
  Library,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  {
    label: "Research Pulse",
    href: "/pulse",
    icon: Activity,
  },
];

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
};

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 flex h-dvh flex-col
        border-r border-white/[0.07]
        bg-[#0b0d11]
        transition-[width,transform] duration-300

        w-[240px]

        ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }

        lg:${
          collapsed
            ? "w-[72px]"
            : "w-[240px]"
        }
      `}
    >
      {/* Header */}
      <div
        className={`
          relative flex h-[64px] shrink-0 items-center
          border-b border-white/[0.07]
          sm:h-[72px]
          ${
            collapsed
              ? "lg:justify-center lg:px-2"
              : "px-4"
          }
        `}
      >
        <div
          className={`
            flex min-w-0 items-center
            ${
              collapsed
                ? "lg:justify-center"
                : "gap-3"
            }
          `}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
            <Sparkles
              size={17}
              strokeWidth={1.8}
            />
          </div>

          <span
            className={`
              whitespace-nowrap text-[15px] font-medium
              tracking-[-0.01em] text-white
              ${
                collapsed
                  ? "lg:hidden"
                  : ""
              }
            `}
          >
            ScholarGraph
          </span>
        </div>

        {/* Desktop collapse */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className={`
            hidden h-8 w-8 shrink-0 items-center
            justify-center rounded-md text-[#858994]
            transition-colors hover:bg-white/[0.06]
            hover:text-white lg:flex
            ${
              collapsed
                ? "absolute -right-4 border border-white/[0.08] bg-[#0b0d11]"
                : "ml-auto"
            }
          `}
        >
          {collapsed ? (
            <ChevronRight
              size={16}
              strokeWidth={1.8}
            />
          ) : (
            <ChevronLeft
              size={16}
              strokeWidth={1.8}
            />
          )}
        </button>

        {/* Mobile close */}
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-[#858994] hover:bg-white/[0.06] hover:text-white md:hidden"
        >
          <X
            size={18}
            strokeWidth={1.7}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 sm:py-6">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

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
                className={`
                  flex h-10 items-center rounded-lg
                  text-sm transition-colors
                  ${
                    collapsed
                      ? "lg:justify-center"
                      : "gap-3 px-3"
                  }
                  ${
                    isActive
                      ? "bg-white/[0.07] text-white"
                      : "text-[#858994] hover:bg-white/[0.04] hover:text-[#d7d8dc]"
                  }
                `}
              >
                <Icon
                  size={18}
                  strokeWidth={1.7}
                  className="shrink-0"
                />

                <span
                  className={`
                    whitespace-nowrap
                    ${
                      collapsed
                        ? "lg:hidden"
                        : ""
                    }
                  `}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <Link
          href="/my-research"
          onClick={onMobileClose}
          title={
            collapsed
              ? "My Research"
              : undefined
          }
          className={`
            flex h-10 items-center rounded-lg
            text-sm text-[#858994]
            transition-colors
            hover:bg-white/[0.04]
            hover:text-[#d7d8dc]
            ${
              collapsed
                ? "lg:justify-center"
                : "gap-3 px-3"
            }
          `}
        >
          <Bookmark
            size={18}
            strokeWidth={1.7}
          />

          <span
            className={`
              whitespace-nowrap
              ${
                collapsed
                  ? "lg:hidden"
                  : ""
              }
            `}
          >
            My Research
          </span>
        </Link>

        <div
          className={`
            px-3 pt-3 text-[10px]
            tracking-[0.04em] text-[#50545d]
            ${
              collapsed
                ? "lg:hidden"
                : ""
            }
          `}
        >
          ScholarGraph · v0.1
        </div>
      </div>
    </aside>
  );
}