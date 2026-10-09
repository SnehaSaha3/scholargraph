"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import {
  ResearchPaper,
  searchPapers,
} from "@/lib/researchApi";

export default function PapersPage() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("query") ?? "";

  const [queryDraft, setQueryDraft] = useState({
    source: urlQuery,
    value: urlQuery,
  });

  const query =
    queryDraft.source === urlQuery
      ? queryDraft.value
      : urlQuery;

  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPapers = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("ScholarGraph paper search:", trimmedQuery);

      const results = await searchPapers(trimmedQuery);

      console.log("ScholarGraph papers received:", results);

      setPapers(results);
    } catch (err) {
      console.error("ScholarGraph paper error:", err);
      setPapers([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load papers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmedQuery = urlQuery.trim();

    if (trimmedQuery) {
  // Intentional: synchronize URL query changes with API search results.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void loadPapers(trimmedQuery);
}
  }, [urlQuery, loadPapers]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadPapers(query);
  }

  const hasActiveQuery = Boolean(
    urlQuery.trim() || query.trim()
  );

  const foundationalPapers = papers.filter(
    (paper) => paper.year > 0 && paper.year < 2022
  );

  const recentPapers = papers.filter(
    (paper) => paper.year >= 2022
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <section className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <FileText
                size={19}
                className="text-[#9b8cff]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Papers
              </h1>

              <p className="mt-1 text-sm text-white/45">
                Explore academic literature relevant to your research.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSearch}
          className="mb-10 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              aria-label="Search papers, topics, or research areas"
              value={query}
              onChange={(event) =>
                setQueryDraft({
                  source: urlQuery,
                  value: event.target.value,
                })
              }
              placeholder="Search papers, topics, or research areas..."
              className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#9b8cff]/40"
            />
          </div>

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="h-12 rounded-xl bg-[#9b8cff] px-6 text-sm font-medium text-[#0b0b0f] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="mb-8 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-5 py-4 text-sm text-red-200/80"
          >
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : !hasActiveQuery ? (
          <EmptyPapers hasQuery={false} />
        ) : papers.length === 0 ? (
          <EmptyPapers hasQuery={true} />
        ) : (
          <div className="space-y-12">
            {foundationalPapers.length > 0 && (
              <PaperSection
                title="Foundational papers"
                description="Earlier literature that provides context and established foundations for the topic."
                papers={foundationalPapers}
              />
            )}

            {recentPapers.length > 0 && (
              <PaperSection
                title="Recent research"
                description="More recent literature related to the research topic."
                papers={recentPapers}
              />
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function PaperSection({
  title,
  description,
  papers,
}: {
  title: string;
  description: string;
  papers: ResearchPaper[];
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-white/40">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        {papers.map((paper, index) => (
          <PaperCard
            key={`${paper.title}-${paper.year}-${index}`}
            paper={paper}
          />
        ))}
      </div>
    </section>
  );
}

function PaperCard({
  paper,
}: {
  paper: ResearchPaper;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.035]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium leading-6 text-white">
            {paper.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
            {paper.authors.length > 0 && (
              <span>
                {paper.authors.slice(0, 4).join(", ")}
                {paper.authors.length > 4 && " et al."}
              </span>
            )}

            {paper.year > 0 && (
              <>
                <span className="text-white/15">•</span>
                <span>{paper.year}</span>
              </>
            )}
          </div>

          {paper.description && (
            <p className="mt-3 text-sm leading-6 text-white/45">
              {paper.description}
            </p>
          )}
        </div>

        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs font-medium text-white/70 transition hover:border-[#9b8cff]/30 hover:text-white"
          >
            Open paper
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </article>
  );
}

function EmptyPapers({
  hasQuery,
}: {
  hasQuery: boolean;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025]">
        <FileText
          size={21}
          className="text-white/30"
        />
      </div>

      <h2 className="text-base font-medium text-white">
        {hasQuery
          ? "No papers found"
          : "Start your paper search"}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
        {hasQuery
          ? "Try a broader research topic, keyword, or different formulation."
          : "Search for academic papers related to your research question or topic."}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
          <div className="mt-3 h-3 w-1/3 rounded bg-white/[0.05]" />
          <div className="mt-4 h-3 w-full rounded bg-white/[0.04]" />
          <div className="mt-2 h-3 w-5/6 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

