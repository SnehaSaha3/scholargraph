"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Compass,
  Database,
  Network,
} from "lucide-react";

const words = ["discoveries.", "possibilities.", "new ideas.", "insights."];

const features = [
  {
    number: "01",
    icon: Compass,
    title: "Discover",
    description:
      "Explore research papers, datasets, and ideas worth investigating.",
    href: "/papers",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "Plan",
    description:
      "Turn an open-ended question into a structured research plan.",
    href: "/planner",
  },
  {
    number: "03",
    icon: Network,
    title: "Build",
    description:
      "Organize projects, connect resources, and keep your research moving.",
    href: "/projects",
  },
];

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="landing-page relative min-h-screen overflow-x-clip bg-[#08090d] text-white">
      <div
        aria-hidden="true"
        className="landing-stars pointer-events-none absolute inset-0"
      />

      <div
        aria-hidden="true"
        className="landing-glow pointer-events-none absolute"
      />

      <header className="relative z-10 mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:h-[76px] sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/h.png"
            alt="ScholarGraph"
            width={38}
            height={38}
            priority
            className="object-contain"
          />

          <span className="text-[17px] font-semibold tracking-tight">
            ScholarGraph
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Sign in
          </Link>

          <Link
            href="/login?mode=register"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5 text-sm font-medium backdrop-blur-lg transition-all hover:border-violet-300/40 hover:bg-white/[0.11]"
          >
            Get started
            <span
              aria-hidden="true"
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-68px)] max-w-7xl flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[calc(100svh-76px)] sm:px-8">
        <div
          aria-hidden="true"
          className="landing-orbit pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
        />

        <div
          aria-hidden="true"
          className="landing-orbit landing-orbit-inner pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
        />

        <h1 className="max-w-4xl text-5xl font-medium leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
          From questions
          <br />
          to{" "}
          <span
            key={wordIndex}
            className="landing-gradient-text landing-word-reveal inline-block font-normal italic"
          >
            {words[wordIndex]}
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-7 text-white/50 sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
          Your space to explore ideas, plan research, and bring scattered
          knowledge together — all in one intelligent workspace.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[10px] uppercase tracking-[0.14em] text-white/35 sm:mt-9 sm:gap-x-7 sm:text-[11px] sm:tracking-[0.18em]">
          <span className="flex items-center gap-2">
            <Database size={14} />
            Research resources
          </span>

          <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

          <span className="flex items-center gap-2">
            <BrainCircuit size={14} />
            AI-assisted planning
          </span>

          <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />

          <span className="flex items-center gap-2">
            <Network size={14} />
            Connected projects
          </span>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 lg:px-12 lg:pb-20">
        <div className="mb-6 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-violet-200/60 sm:text-[11px]">
              Your research, in motion
            </p>

            <h2 className="mt-2 text-xl font-medium tracking-tight sm:mt-3 sm:text-3xl">
              One question. A world of possibilities.
            </h2>
          </div>

          <p className="max-w-sm text-sm leading-6 text-white/40">
            Move from the first spark of curiosity to a clearer path forward.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Link
                key={feature.number}
                href={feature.href}
                aria-label={`${feature.title}: ${feature.description}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-200/25 hover:bg-white/[0.075] hover:shadow-[0_12px_40px_rgba(139,92,246,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 sm:p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-300/[0.07] via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/15 bg-violet-200/[0.08] text-violet-100/90 transition-colors group-hover:bg-violet-200/[0.13] sm:h-11 sm:w-11">
                      <Icon size={19} strokeWidth={1.5} />
                    </div>

                    <span className="font-mono text-xs tracking-wider text-white/30">
                      {feature.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-medium tracking-tight text-white/90 transition-colors group-hover:text-violet-100 sm:mt-8">
                    {feature.title}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/50 sm:mt-3">
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-5 py-6 text-center text-xs sm:py-7">
          <span className="text-white/45">
            ScholarGraph © {new Date().getFullYear()}
          </span>

          <span className="text-white/45">
            Built by <span className="text-violet-200/80">Sneha</span>
          </span>
        </div>
      </footer>
    </main>
  );
}