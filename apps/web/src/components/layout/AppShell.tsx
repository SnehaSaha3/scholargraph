"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08090c] text-white">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="
            fixed inset-0 z-30
            bg-black/60
            backdrop-blur-[2px]
            md:hidden
          "
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() =>
          setCollapsed((value) => !value)
        }
        onMobileClose={() =>
          setMobileOpen(false)
        }
      />

      <div
        className={
          collapsed
            ? "min-h-screen transition-[margin] duration-300 lg:ml-[72px]"
            : "min-h-screen transition-[margin] duration-300 lg:ml-[280px]"
        }
      >
        <Topbar
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="min-w-0 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}