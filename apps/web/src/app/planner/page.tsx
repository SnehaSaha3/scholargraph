"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import {
  getResearchConversation,
  type ResearchDailyTask,
  type ResearchPlan,
} from "@/lib/researchApi";

const PROGRESS_STORAGE_KEY = "scholargraph:planner-progress";

function isValidPlan(value: unknown): value is ResearchPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ResearchPlan>;

  return (
    typeof candidate.question === "string" &&
    Array.isArray(candidate.daily_tasks) &&
    Array.isArray(candidate.milestones)
  );
}

function getTaskId(task: ResearchDailyTask): string {
  return `${task.day}-${task.title}`;
}

function getProgressStorageKey(conversationId: string): string {
  return `${PROGRESS_STORAGE_KEY}:${encodeURIComponent(conversationId)}`;
}

function PlannerContent() {
  const searchParams = useSearchParams();
  const requestedConversationId =
    searchParams.get("conversationId")?.trim() || null;

  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPlan = useCallback(async (conversationId: string | null) => {
    // Clear the previous conversation immediately. Never leave an old
    // plan visible while a different plan is loading.
    setPlan(null);
    setCompleted([]);
    setLoadError(null);

    if (!conversationId) {
      // Direct /planner visits intentionally show an empty planner.
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const conversation = await getResearchConversation(conversationId);

      // Find the latest saved plan in this conversation only.
      const savedPlanMessage = [...conversation.messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" &&
            message.kind === "plan" &&
            message.payload !== null
        );

      const payload = savedPlanMessage?.payload;

      if (!isValidPlan(payload)) {
        setPlan(null);
        setLoadError(
          "No saved research plan was found in this conversation. Generate a plan from the Research page first."
        );
        return;
      }

      const restoredPlan: ResearchPlan = {
        ...payload,
        conversation_id: conversationId,
      };

      setPlan(restoredPlan);
    } catch (error) {
      console.error("[Planner] Could not load saved plan:", error);
      setPlan(null);
      setLoadError(
        "Could not load the saved research plan. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!requestedConversationId) {
        setPlan(null);
        setCompleted([]);
        setLoadError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setPlan(null);
      setCompleted([]);
      setLoadError(null);

      try {
        const conversation = await getResearchConversation(
          requestedConversationId
        );

        if (cancelled) return;

        const savedPlanMessage = [...conversation.messages]
          .reverse()
          .find(
            (message) =>
              message.role === "assistant" &&
              message.kind === "plan" &&
              message.payload !== null
          );

        if (!isValidPlan(savedPlanMessage?.payload)) {
          setPlan(null);
          setLoadError(
            "No saved research plan was found in this conversation. Generate a plan from the Research page first."
          );
          return;
        }

        const restoredPlan: ResearchPlan = {
          ...savedPlanMessage.payload,
          conversation_id: requestedConversationId,
        };

        setPlan(restoredPlan);
      } catch (error) {
        if (cancelled) return;

        console.error("[Planner] Could not load saved plan:", error);
        setPlan(null);
        setLoadError(
          "Could not load the saved research plan. Please check your connection and try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [requestedConversationId]);

  // Restore progress only for the selected conversation.
  // No conversation ID means no plan and no progress.
  useEffect(() => {
    if (!plan?.conversation_id) {
      setCompleted([]);
      return;
    }

    try {
      const savedProgress = localStorage.getItem(
        getProgressStorageKey(plan.conversation_id)
      );

      if (!savedProgress) {
        setCompleted([]);
        return;
      }

      const parsed: unknown = JSON.parse(savedProgress);

      setCompleted(
        Array.isArray(parsed)
          ? parsed.filter(
              (item): item is string => typeof item === "string"
            )
          : []
      );
    } catch (error) {
      console.error("[Planner] Could not restore task progress:", error);
      setCompleted([]);
    }
  }, [plan]);

  function toggleTask(task: ResearchDailyTask) {
    if (!plan?.conversation_id) return;

    const taskId = getTaskId(task);
    const storageKey = getProgressStorageKey(plan.conversation_id);

    setCompleted((current) => {
      const next = current.includes(taskId)
        ? current.filter((item) => item !== taskId)
        : [...current, taskId];

      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (error) {
        console.error("[Planner] Could not save task progress:", error);
      }

      return next;
    });
  }

  function resetProgress() {
    setCompleted([]);

    if (!plan?.conversation_id) return;

    try {
      localStorage.removeItem(
        getProgressStorageKey(plan.conversation_id)
      );
    } catch (error) {
      console.error("[Planner] Could not reset task progress:", error);
    }
  }

  const tasks = plan?.daily_tasks ?? [];

  const validCompleted = useMemo(
    () =>
      completed.filter((id) =>
        tasks.some((task) => getTaskId(task) === id)
      ),
    [completed, tasks]
  );

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;

    return Math.round((validCompleted.length / tasks.length) * 100);
  }, [tasks, validCompleted]);

  const completedHours = useMemo(() => {
    const completedMinutes = tasks
      .filter((task) => validCompleted.includes(getTaskId(task)))
      .reduce((total, task) => total + task.estimated_minutes, 0);

    return Math.round((completedMinutes / 60) * 10) / 10;
  }, [tasks, validCompleted]);

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
              Planner
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Research track
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
              Your research broken into concrete daily work instead of a vague roadmap.
            </p>
          </div>

          {tasks.length > 0 && (
            <button
              type="button"
              onClick={resetProgress}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-[#777b85] transition hover:border-white/[0.12] hover:text-white"
            >
              <RotateCcw size={14} />
              Reset progress
            </button>
          )}
        </div>

        {loading ? (
          <div className="mt-12 text-center text-sm text-[#777b86]">
            Loading your saved research plan...
          </div>
        ) : !plan ? (
          <div className="mt-12">
            {loadError && (
              <p
                role="alert"
                className="mb-4 text-center text-sm text-red-400"
              >
                {loadError}
              </p>
            )}

            <EmptyPlanner />
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#5d616c]">
                Current research question
              </p>

              <p className="mt-3 text-sm leading-6 text-[#c6c8ce]">
                {plan.question}
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[#777b86]">
                    Research progress
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-white">
                    {progress}%
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#777b86]">
                    Completed
                  </p>

                  <p className="mt-1 text-sm text-[#c9cbd1]">
                    {validCompleted.length} / {tasks.length} tasks
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[#9b8cff] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-[10px] text-[#555963]">
                {completedHours} hours of tracked research work
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-[#272a33] bg-[#0d0f14]">
              <div className="border-b border-white/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                    <CalendarDays size={16} />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#656974]">
                      Daily track
                    </p>

                    <h2 className="mt-1 text-sm font-medium text-white">
                      First {tasks.length} days
                    </h2>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {tasks.map((task) => {
                  const taskId = getTaskId(task);

                  return (
                    <DailyTask
                      key={taskId}
                      task={task}
                      completed={validCompleted.includes(taskId)}
                      onToggle={() => toggleTask(task)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#656974]">
                Long-term structure
              </p>

              <h2 className="mt-1 text-sm font-medium text-white">
                Research milestones
              </h2>

              <div className="mt-5 grid gap-3">
                {plan.milestones.map((milestone, index) => (
                  <div
                    key={`${milestone.title}-${index}`}
                    className="rounded-xl border border-white/[0.05] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-[10px] text-[#777b85]">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xs font-medium text-[#d0d2d8]">
                            {milestone.title}
                          </h3>

                          <span className="text-[10px] text-[#555963]">
                            {milestone.estimated_hours}h
                          </span>
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-[#70747f]">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}

function DailyTask({
  task,
  completed,
  onToggle,
}: {
  task: ResearchDailyTask;
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 p-5 transition ${
        completed ? "bg-white/[0.01]" : "hover:bg-white/[0.015]"
      }`}
    >
      <label className="relative mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          aria-label={
            completed
              ? `Mark "${task.title}" incomplete`
              : `Mark "${task.title}" complete`
          }
          className="peer absolute h-6 w-6 cursor-pointer opacity-0"
        />

        <span
          className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
            completed
              ? "border-[#9b8cff] bg-[#9b8cff]"
              : "border-white/[0.14] bg-transparent peer-hover:border-[#9b8cff]/50"
          }`}
        >
          {completed && (
            <CheckCircle2 size={15} className="text-[#0b0b0f]" />
          )}
        </span>
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3
              className={`text-sm font-medium transition ${
                completed
                  ? "text-[#666a74] line-through"
                  : "text-[#d4d5da]"
              }`}
            >
              {task.title}
            </h3>

            <p className="mt-1 text-[11px] leading-5 text-[#70747f]">
              {task.description}
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#555963]">
            <Clock3 size={11} />
            {task.estimated_minutes} min
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-white/[0.03] px-2 py-1 text-[9px] text-[#5f636e]">
            {task.milestone}
          </span>

          {task.resource_title && task.resource_url && (
            <a
              href={task.resource_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 text-[10px] text-[#777b86] hover:text-[#9b8cff]"
            >
              <ExternalLink size={11} />
              <span className="truncate">{task.resource_title}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPlanner() {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-white/[0.08] p-10 text-center">
      <CalendarDays size={26} className="mx-auto text-[#555963]" />

      <h2 className="mt-4 text-sm font-medium text-[#c4c6cc]">
        Your research track is empty
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#686c77]">
        Start with a research question on the Research page.
        ScholarGraph will generate the research structure and daily
        track here.
      </p>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08090c] text-sm text-[#777b86]">
          Loading planner...
        </div>
      }
    >
      <PlannerContent />
    </Suspense>
  );
}
