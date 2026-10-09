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

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        className={[
          "min-h-screen transition-[margin] duration-300",
          collapsed
            ? "lg:ml-[76px]"
            : "lg:ml-[260px]",
        ].join(" ")}
      >
        <Topbar
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}