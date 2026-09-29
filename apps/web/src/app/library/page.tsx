"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  LibraryBig,
  Search,
  UserRound,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

import {
  ResearchResource,
  searchBooks,
} from "@/lib/researchApi";

const DEFAULT_QUERY = "computer vision object detection";

export default function LibraryPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [books, setBooks] = useState<ResearchResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadBooks(searchQuery: string) {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log(
        "ScholarGraph frontend searching:",
        trimmedQuery
      );

      const results = await searchBooks(trimmedQuery);

      console.log(
        "ScholarGraph frontend received:",
        results
      );

      setBooks(results);
    } catch (err) {
      console.error(
        "ScholarGraph library error:",
        err
      );

      setBooks([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load books."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void loadBooks(query);
  }

  useEffect(() => {
    void loadBooks(DEFAULT_QUERY);
  }, []);

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">

        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
              Library
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                <LibraryBig
                  size={17}
                  strokeWidth={1.7}
                />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                Research Library
              </h1>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
              Discover books and legitimate sources connected to your research.
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
                placeholder="Search books, authors, topics..."
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.025] pl-11 pr-4 text-sm text-[#d4d5da] outline-none transition placeholder:text-[#555963] focus:border-[#9b8cff]/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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

            Searching Open Library...
          </div>
        )}

        {/* Results */}
        {!loading && books.length > 0 && (
          <section className="mt-8">
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#656974]">
                Results
              </p>

              <div className="mt-1 flex items-center justify-between gap-4">
                <h2 className="text-sm font-medium text-white">
                  Books related to your search
                </h2>

                <span className="text-[10px] text-[#555963]">
                  {books.length} result
                  {books.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book, index) => (
                <BookCard
                  key={`${book.title}-${index}`}
                  book={book}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          books.length === 0 && (
            <EmptyLibrary />
          )}
      </main>
    </AppShell>
  );
}


function BookCard({
  book,
}: {
  book: ResearchResource;
}) {
  const publicationYear = book.year;

  const authors =
    book.authors &&
    book.authors.length > 0
      ? book.authors.join(", ")
      : "Author information unavailable";

  const actionUrl =
    book.borrow_url ??
    book.read_url ??
    book.url ??
    null;

  const actionLabel =
    book.action_label ??
    (book.borrow_url
      ? "Borrow"
      : book.read_url
        ? "Read online"
        : "View source");

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#272a33] bg-[#0d0f14] transition hover:border-white/[0.12]">

      {/* Cover */}
      <div className="flex h-64 items-center justify-center overflow-hidden border-b border-white/[0.06] bg-black/20">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-[#555963]">
            <BookOpen
              size={40}
              strokeWidth={1.2}
            />

            <span className="mt-3 text-[10px]">
              No cover available
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-5">

        <span className="w-fit rounded-md bg-white/[0.035] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#686c77]">
          {book.resource_type}
        </span>

        <h2 className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-[#d4d5da]">
          {book.title}
        </h2>

        {/* Author */}
        <div className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[#777b86]">
          <UserRound
            size={13}
            className="mt-0.5 shrink-0"
            strokeWidth={1.6}
          />

          <span className="line-clamp-2">
            {authors}
          </span>
        </div>

        {/* Year */}
        {publicationYear !== undefined &&
          publicationYear > 0 && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#5f636e]">
              <CalendarDays
                size={12}
                strokeWidth={1.6}
              />

              <span>
                First published {publicationYear}
              </span>
            </div>
          )}

        {/* Description */}
        {book.description && (
          <p className="mt-4 line-clamp-3 text-[11px] leading-5 text-[#70747f]">
            {book.description}
          </p>
        )}

        {/* Subjects */}
        {book.subjects &&
          book.subjects.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {book.subjects
                .slice(0, 4)
                .map((subject) => (
                  <span
                    key={subject}
                    className="rounded-md bg-white/[0.03] px-2 py-1 text-[9px] text-[#5f636e]"
                  >
                    {subject}
                  </span>
                ))}
            </div>
          )}

        <div className="flex-1" />

        {/* External source */}
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          {actionUrl ? (
            <a
              href={actionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2.5 text-[10px] text-[#777b86] transition hover:border-[#9b8cff]/30 hover:text-[#9b8cff]"
            >
              <ExternalLink
                size={12}
                strokeWidth={1.6}
              />

              {actionLabel}
            </a>
          ) : (
            <div className="flex w-full items-center justify-center rounded-lg border border-white/[0.05] px-3 py-2.5 text-[10px] text-[#555963]">
              No source available
            </div>
          )}
        </div>
      </div>
    </article>
  );
}


function EmptyLibrary() {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-white/[0.08] p-10 text-center">
      <BookOpen
        size={26}
        className="mx-auto text-[#555963]"
        strokeWidth={1.4}
      />

      <h2 className="mt-4 text-sm font-medium text-[#c4c6cc]">
        No books found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#686c77]">
        Try a broader research topic, author name, or keyword.
      </p>
    </div>
  );
}