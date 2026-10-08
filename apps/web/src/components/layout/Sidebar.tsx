"use client";

import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  FolderKanban,
  Library,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ConversationHistory from "./ConversationHistory";

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
  const router = useRouter();

  function handleNewResearch() {
    onMobileClose();

    window.dispatchEvent(
      new CustomEvent(
        "scholargraph:new-research",
      ),
    );

    router.push("/");
  }

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40
        flex h-dvh flex-col
        border-r border-white/[0.07]
        bg-[#0b0d11]
        transition-[width,transform]
        duration-300

        w-[280px]

        ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }

        ${
          collapsed
            ? "lg:w-[72px]"
            : "lg:w-[280px]"
        }
      `}
    >
      {/* ───────────────── Header ───────────────── */}

      <div
        className={`
          relative flex h-[64px]
          shrink-0 items-center
          border-b border-white/[0.07]
          sm:h-[68px]

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
          <div
            className="
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-lg
              border border-white/[0.09]
              bg-white/[0.045]
            "
          >
            <Sparkles
              size={16}
              strokeWidth={1.8}
            />
          </div>

          <span
            className={`
              whitespace-nowrap
              text-[14px]
              font-medium
              tracking-[-0.01em]
              text-white

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
            hidden h-8 w-8 shrink-0
            items-center justify-center
            rounded-md
            text-[#777c86]
            transition-colors
            hover:bg-white/[0.06]
            hover:text-white
            lg:flex

            ${
              collapsed
                ? "absolute -right-4 border border-white/[0.08] bg-[#0b0d11]"
                : "ml-auto"
            }
          `}
        >
          {collapsed ? (
            <ChevronRight
              size={15}
              strokeWidth={1.8}
            />
          ) : (
            <ChevronLeft
              size={15}
              strokeWidth={1.8}
            />
          )}
        </button>

        {/* Mobile close */}
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="
            ml-auto flex h-8 w-8
            items-center justify-center
            rounded-md
            text-[#777c86]
            hover:bg-white/[0.06]
            hover:text-white
            md:hidden
          "
        >
          <X
            size={18}
            strokeWidth={1.7}
          />
        </button>
      </div>

      {/* ───────────────── Sidebar body ───────────────── */}

      <div className="flex min-h-0 flex-1 flex-col">
        {/* New Research */}
        <div className="shrink-0 px-3 py-4">
          <button
            type="button"
            onClick={handleNewResearch}
            title={
              collapsed
                ? "New Research"
                : undefined
            }
            className={`
              flex h-10 w-full
              items-center
              rounded-lg
              border border-white/[0.08]
              bg-white/[0.035]
              text-sm
              text-[#d9dbe0]
              transition-colors

              hover:border-white/[0.13]
              hover:bg-white/[0.065]
              hover:text-white

              ${
                collapsed
                  ? "lg:justify-center"
                  : "gap-2.5 px-3"
              }
            `}
          >
            <Plus
              size={17}
              strokeWidth={1.8}
            />

            <span
              className={
                collapsed
                  ? "lg:hidden"
                  : ""
              }
            >
              New Research
            </span>
          </button>
        </div>

        {/* Conversation history */}
        <div
          className={`
            min-h-0 flex-1 overflow-y-auto
            ${
              collapsed
                ? "lg:overflow-hidden"
                : ""
            }
          `}
        >
          <div
            className={
              collapsed
                ? "hidden"
                : "mb-3 px-5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#555a64]"
            }
          >
            Conversations
          </div>

          <ConversationHistory
            collapsed={collapsed}
            onMobileClose={onMobileClose}
          />
        </div>

        {/* ───────────────── Product navigation ───────────────── */}

        <div
          className="
            shrink-0
            border-t border-white/[0.07]
            px-3 py-3
          "
        >
          <div
            className={
              collapsed
                ? "hidden"
                : "mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#555a64]"
            }
          >
            Research
          </div>

          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active =
                isActiveRoute(item.href);

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
                    flex h-9 w-full
                    items-center
                    rounded-lg
                    text-[13px]
                    transition-colors

                    ${
                      collapsed
                        ? "lg:justify-center"
                        : "gap-3 px-2.5"
                    }

                    ${
                      active
                        ? "bg-white/[0.07] text-white"
                        : "text-[#858994] hover:bg-white/[0.04] hover:text-[#d6d8dd]"
                    }
                  `}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.7}
                    className="shrink-0"
                  />

                  <span
                    className={
                      collapsed
                        ? "lg:hidden"
                        : ""
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ───────────────── Account ───────────────── */}

        <div
          className="
            shrink-0
            border-t border-white/[0.07]
            p-3
          "
        >
          <Link
            href="/account"
            onClick={onMobileClose}
            title={
              collapsed
                ? "Account"
                : undefined
            }
            className={`
              flex h-10 w-full
              items-center
              rounded-lg
              text-[13px]
              text-[#858994]
              transition-colors
              hover:bg-white/[0.045]
              hover:text-[#d6d8dd]

              ${
                collapsed
                  ? "lg:justify-center"
                  : "gap-3 px-2.5"
              }
            `}
          >
            <div
              className="
                flex h-6 w-6
                shrink-0
                items-center justify-center
                rounded-full
                border border-white/[0.1]
                bg-white/[0.045]
              "
            >
              <UserRound
                size={13}
                strokeWidth={1.7}
              />
            </div>

            <div
              className={`
                min-w-0 flex-1
                ${
                  collapsed
                    ? "lg:hidden"
                    : ""
                }
              `}
            >
              <div className="truncate text-[#c6c8ce]">
                Account
              </div>

              <div className="truncate text-[10px] text-[#555a64]">
                Set up your profile
              </div>
            </div>

            <Settings
              size={15}
              strokeWidth={1.7}
              className={
                collapsed
                  ? "hidden"
                  : "text-[#555a64]"
              }
            />
          </Link>

          <div
            className={
              collapsed
                ? "hidden"
                : "px-2 pt-2 text-[10px] text-[#444850]"
            }
          >
            ScholarGraph · v0.1
          </div>
        </div>
      </div>
    </aside>
  );
}