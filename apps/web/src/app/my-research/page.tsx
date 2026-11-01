"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  FolderGit2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  deleteResearchConversation,
  listResearchHistory,
  listSavedProjects,
  type ResearchConversationSummary,
  type SavedProject,
} from "@/lib/researchApi";

function formatDate(value: string | null | undefined) {
  if (!value) return "recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "recently";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyResearchPage() {
  const [conversations, setConversations] = useState<
    ResearchConversationSummary[]
  >([]);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const [history, saved] = await Promise.allSettled([
        listResearchHistory(),
        listSavedProjects(),
      ]);

      if (cancelled) return;

      setConversations(
        history.status === "fulfilled" ? history.value : []
      );
      setProjects(saved.status === "fulfilled" ? saved.value : []);

      const failure =
        history.status === "rejected"
          ? history.reason
          : saved.status === "rejected"
            ? saved.reason
            : null;

      setError(
        failure
          ? failure instanceof Error
            ? failure.message
            : "Unable to load your saved work."
          : ""
      );
      setLoading(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function refresh() {
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  async function handleDelete(conversation: ResearchConversationSummary) {
    const confirmed = window.confirm(
      `Delete "${conversation.title}" and its saved results?`
    );

    if (!confirmed) return;

    setDeletingId(conversation.id);
    setError("");

    try {
      await deleteResearchConversation(conversation.id);
      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this conversation."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
              My Research
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                <Bookmark size={17} strokeWidth={1.7} />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                Saved work
              </h1>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
              Your research conversations and connected projects in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-xs text-[#777b86] transition hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={13}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-xs text-red-300"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-[#272a33] bg-[#0d0f14] px-6 py-16 text-sm text-[#777b86]">
            <Loader2 size={17} className="animate-spin text-[#9b8cff]" />
            Loading your saved work...
          </div>
        ) : (
          <>
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-white">
                  Research conversations
                </h2>

                <span className="text-[10px] text-[#555963]">
                  {conversations.length} saved
                </span>
              </div>

              {conversations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-xs leading-5 text-[#686c77]">
                  No saved research yet. Explore a question on the Research
                  page and it will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conversation) => (
                    <article
                      key={conversation.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-4 transition hover:border-white/[0.12]"
                    >
                      <Link
                        href={`/workspace?conversationId=${encodeURIComponent(
                          conversation.id
                        )}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#9b8cff]">
                          <MessageSquare size={16} strokeWidth={1.6} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium text-[#d4d5da]">
                            {conversation.title}
                          </h3>

                          <p className="mt-1 flex items-center gap-2 text-[10px] text-[#5f636e]">
                            <CalendarDays size={11} />
                            Updated {formatDate(conversation.updated_at)}
                            <span>·</span>
                            {conversation.message_count} message
                            {conversation.message_count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </Link>

                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/planner?conversationId=${encodeURIComponent(
                            conversation.id
                          )}`}
                          className="hidden rounded-lg border border-white/[0.07] px-3 py-2 text-[10px] text-[#777b86] transition hover:border-[#9b8cff]/30 hover:text-[#9b8cff] sm:inline-flex"
                        >
                          Plan
                        </Link>

                        <button
                          type="button"
                          onClick={() => void handleDelete(conversation)}
                          disabled={deletingId === conversation.id}
                          aria-label={`Delete ${conversation.title}`}
                          title="Delete"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#555963] transition hover:bg-red-400/[0.06] hover:text-red-300 disabled:opacity-50"
                        >
                          {deletingId === conversation.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-white">
                  Connected projects
                </h2>

                <span className="text-[10px] text-[#555963]">
                  {projects.length} saved
                </span>
              </div>

              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] p-8 text-center text-xs leading-5 text-[#686c77]">
                  No connected projects yet. Connect a GitHub repository on
                  the Projects page.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects?id=${encodeURIComponent(project.id)}`}
                      className="group rounded-2xl border border-[#272a33] bg-[#0d0f14] p-4 transition hover:border-[#9b8cff]/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                          <FolderGit2 size={16} strokeWidth={1.6} />
                        </div>

                        <ArrowRight
                          size={14}
                          className="text-[#4e525d] transition group-hover:text-[#9b8cff]"
                        />
                      </div>

                      <h3 className="mt-4 truncate text-sm font-medium text-[#d4d5da]">
                        {project.repository_name}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#70747f]">
                        {project.result.advisor.summary}
                      </p>

                      <p className="mt-3 text-[10px] text-[#555963]">
                        Updated {formatDate(project.updated_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}