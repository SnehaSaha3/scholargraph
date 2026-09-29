"use client";

import {
  Database,
  ExternalLink,
  Search,
} from "lucide-react";

import { useState } from "react";

import AppShell from "@/components/layout/AppShell";

import {
  searchDatasets,
  type ResearchResource,
} from "@/lib/researchApi";


export default function DatasetsPage() {

  const [query, setQuery] =
    useState("");

  const [datasets, setDatasets] =
    useState<ResearchResource[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleSearch() {

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError("");

    try {

      const results =
        await searchDatasets(
          query.trim()
        );

      setDatasets(results);

    } catch (error) {

      console.error(error);

      setError(
        "Dataset search failed. Make sure the research engine is running."
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <AppShell>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">

        <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
          Dataset explorer
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          Find research data
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
          Search real dataset records and open the original dataset page.
        </p>


        <div className="mt-8 flex max-w-3xl gap-2 rounded-xl border border-[#272a33] bg-[#0d0f14] p-2">

          <Search
            size={18}
            className="ml-2 mt-2.5 shrink-0 text-[#555963]"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={(event) => {

              if (event.key === "Enter") {
                handleSearch();
              }

            }}
            placeholder="computer vision, NLP, medical imaging..."
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-[#50545e]"
          />

          <button
            type="button"
            onClick={handleSearch}
            disabled={
              loading ||
              !query.trim()
            }
            className="rounded-lg bg-[#9b8cff] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#aa9dff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>

        </div>


        {error && (
          <div className="mt-4 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}


        {!datasets.length &&
          !loading &&
          !error && (
            <div className="mt-12 rounded-2xl border border-dashed border-white/[0.07] p-10 text-center">

              <Database
                size={25}
                className="mx-auto text-[#555963]"
              />

              <p className="mt-3 text-sm text-[#777b86]">
                Search for datasets related to your research.
              </p>

            </div>
          )}


        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {datasets.map((dataset) => (

            <a
              key={
                dataset.url ??
                dataset.title
              }
              href={
                dataset.url ??
                "#"
              }
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 transition hover:border-[#393344]"
            >

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                  <Database size={17} />
                </div>


                <div className="min-w-0 flex-1">

                  <div className="flex items-start gap-2">

                    <h2 className="min-w-0 flex-1 text-sm leading-5 text-[#d2d4da] group-hover:text-white">
                      {dataset.title}
                    </h2>

                    <ExternalLink
                      size={13}
                      className="mt-1 shrink-0 text-[#555963]"
                    />

                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-[#686c77]">
                    {dataset.description}
                  </p>

                  <span className="mt-3 inline-block text-[9px] uppercase tracking-[0.1em] text-[#535762]">
                    {dataset.resource_type}
                  </span>

                </div>

              </div>

            </a>

          ))}

        </div>

      </main>

    </AppShell>
  );
}