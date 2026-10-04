"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Database,
  ExternalLink,
  Search,
  Tag,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import AppShell from "@/components/layout/AppShell";

import {
  ResearchResource,
  searchDatasets,
} from "@/lib/researchApi";

export default function DatasetsPage() {
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("query") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [datasets, setDatasets] = useState<ResearchResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDatasets(searchQuery: string) {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setDatasets([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log(
        "ScholarGraph dataset search:",
        trimmedQuery
      );

      const results = await searchDatasets(
        trimmedQuery
      );

      console.log(
        "ScholarGraph datasets received:",
        results
      );

      setDatasets(results);
    } catch (err) {
      console.error(
        "ScholarGraph dataset error:",
        err
      );

      setDatasets([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load datasets."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Research → View more can open:
   *
   * /datasets?query=breast%20cancer
   *
   * In that case, automatically search for the
   * query from the Research page.
   *
   * Directly opening:
   *
   * /datasets
   *
   * leaves the page empty.
   */
  useEffect(() => {
    const trimmedQuery = urlQuery.trim();

    setQuery(urlQuery);

    if (!trimmedQuery) {
      setDatasets([]);
      setError("");
      return;
    }

    void loadDatasets(trimmedQuery);
  }, [urlQuery]);

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void loadDatasets(query);
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">

        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
              Datasets
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                <Database
                  size={17}
                  strokeWidth={1.7}
                />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                Dataset Explorer
              </h1>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
              Find datasets relevant to your research question,
              experiments, and models.
            </p>
          </div>
        </div>

        {/* Search */}
        <section className="mt-8 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555963]"
                strokeWidth={1.7}
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search datasets, tasks, domains..."
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.025] pl-11 pr-4 text-sm text-[#d4d5da] outline-none transition placeholder:text-[#555963] focus:border-[#9b8cff]/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#9b8cff]/25 bg-[#9b8cff]/10 px-5 text-xs font-medium text-[#c5beff] transition hover:bg-[#9b8cff]/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search
                size={14}
                strokeWidth={1.8}
              />

              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 flex items-center gap-3 text-xs text-[#777b86]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/[0.08] border-t-[#9b8cff]" />

            Searching Hugging Face datasets...
          </div>
        )}

        {/* Results */}
        {!loading && datasets.length > 0 && (
          <section className="mt-8">
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#656974]">
                Results
              </p>

              <div className="mt-1 flex items-center justify-between gap-4">
                <h2 className="text-sm font-medium text-white">
                  Research datasets
                </h2>

                <span className="text-[10px] text-[#555963]">
                  {datasets.length} result
                  {datasets.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {datasets.map((dataset, index) => (
                <DatasetCard
                  key={`${dataset.title}-${index}`}
                  dataset={dataset}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          datasets.length === 0 && (
            <EmptyDatasets
              hasQuery={Boolean(urlQuery.trim())}
            />
          )}
      </main>
    </AppShell>
  );
}


function DatasetCard({
  dataset,
}: {
  dataset: ResearchResource;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 transition hover:border-white/[0.12]">

      {/* Type */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.035] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#686c77]">
          <Database
            size={11}
            strokeWidth={1.6}
          />

          Dataset
        </span>

        {dataset.source && (
          <span className="text-[9px] text-[#555963]">
            {dataset.source}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-[#d4d5da]">
        {dataset.title}
      </h2>

      {/* Description */}
      {dataset.description && (
        <p className="mt-3 line-clamp-4 text-[11px] leading-5 text-[#70747f]">
          {dataset.description}
        </p>
      )}

      {/* Subjects */}
      {dataset.subjects &&
        dataset.subjects.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {dataset.subjects
              .slice(0, 5)
              .map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] px-2 py-1 text-[9px] text-[#5f636e]"
                >
                  <Tag
                    size={10}
                    strokeWidth={1.5}
                  />

                  {subject}
                </span>
              ))}
          </div>
        )}

      <div className="flex-1" />

      {/* Source */}
      <div className="mt-6 border-t border-white/[0.06] pt-4">
        {dataset.url ? (
          <a
            href={dataset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2.5 text-[10px] text-[#777b86] transition hover:border-[#9b8cff]/30 hover:text-[#9b8cff]"
          >
            <ExternalLink
              size={12}
              strokeWidth={1.6}
            />

            Open dataset
          </a>
        ) : (
          <div className="flex w-full items-center justify-center rounded-lg border border-white/[0.05] px-3 py-2.5 text-[10px] text-[#555963]">
            No source available
          </div>
        )}
      </div>
    </article>
  );
}


function EmptyDatasets({
  hasQuery,
}: {
  hasQuery: boolean;
}) {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-white/[0.08] p-10 text-center">
      <Database
        size={26}
        className="mx-auto text-[#555963]"
        strokeWidth={1.4}
      />

      <h2 className="mt-4 text-sm font-medium text-[#c4c6cc]">
        {hasQuery
          ? "No datasets found"
          : "Start your dataset search"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#686c77]">
        {hasQuery
          ? "Try a broader research topic, model task, or dataset keyword."
          : "Search for datasets related to your research question, experiment, or model."}
      </p>
    </div>
  );
}