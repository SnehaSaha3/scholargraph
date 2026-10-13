"use client";

import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Database,
  FlaskConical,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  Search,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import AppShell from "@/components/layout/AppShell";

import {
  discussResearch,
  exploreResearch,
  generateResearchPlan,
  ResearchDiscussionMessage,
  ResearchDiscussionResponse,
  getResearchConversation,
  ResearchExploration,
  ResearchPaper,
} from "@/lib/researchApi";

type ResearchSectionProps = {
  title: string;
  icon: typeof Search;
  items: string[];
};

const LAST_EXPLORATION_KEY = "scholargraph:last-exploration";
const LAST_PLAN_KEY = "scholargraph:last-plan";

function ResearchSection({
  title,
  icon: Icon,
  items,
}: ResearchSectionProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.045]">
          <Icon
            size={16}
            strokeWidth={1.7}
            className="text-[#b6a9ff]"
          />
        </div>

        <h2 className="text-sm font-medium text-white">
          {title}
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex gap-3 text-sm leading-6 text-[#a6a9b3]"
          >
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#555963]" />
            <span>{item}</span>
          </div>
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
    <article className="group rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 transition hover:border-white/[0.13]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#5e626d]">
            {paper.year}
          </p>

          <h3 className="mt-2 text-sm font-medium leading-6 text-[#e4e5e9]">
            {paper.title}
          </h3>
        </div>

        <BookOpen
          size={16}
          className="shrink-0 text-[#555963]"
        />
      </div>

      {paper.authors?.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-[#70747f]">
          {paper.authors.slice(0, 3).join(", ")}
          {paper.authors.length > 3 ? " et al." : ""}
        </p>
      )}

      {paper.description && (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#858994]">
          {paper.description}
        </p>
      )}

      {paper.url && (
        <a
          href={paper.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#9388d9] transition hover:text-white"
        >
          Open paper
          <ArrowRight size={12} />
        </a>
      )}
    </article>
  );
}

function ResourceSummary({
  icon: Icon,
  title,
  count,
  href,
}: {
  icon: typeof BookOpen;
  title: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 transition hover:border-white/[0.13]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.045]">
          <Icon
            size={16}
            className="text-[#b6a9ff]"
          />
        </div>

        <ChevronRight
          size={15}
          className="text-[#4e525d] transition group-hover:translate-x-0.5 group-hover:text-[#8d86b7]"
        />
      </div>

      <p className="mt-5 text-sm font-medium text-[#dedfe3]">
        {title}
      </p>

      <p className="mt-1 text-xs text-[#696d78]">
        {count} {count === 1 ? "result" : "results"}
      </p>
    </Link>
  );
}

export default function ResearchPage() {
  const [question, setQuestion] = useState("");

  const [research, setResearch] =
    useState<ResearchExploration | null>(null);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<
    ResearchDiscussionMessage[]
  >([]);

  const [discussionInput, setDiscussionInput] =
    useState("");

  const [discussionResponse, setDiscussionResponse] =
    useState<ResearchDiscussionResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [discussionLoading, setDiscussionLoading] =
    useState(false);

  const [planLoading, setPlanLoading] = useState(false);

  const [error, setError] = useState("");

  const [showPlanAction, setShowPlanAction] =
    useState(false);

  // Prevent an earlier request from replacing the result of a newer request.
  const researchRequestId = useRef(0);
  const planRequestId = useRef(0);
  const discussionRequestId = useRef(0);

 
  
  useEffect(() => {
    let disposed = false;

    async function handleOpenConversation(event: Event) {
      const customEvent = event as CustomEvent<{
        conversationId?: string;
      }>;

      const id = customEvent.detail?.conversationId;
      if (!id) return;

      const requestId = ++researchRequestId.current;
      planRequestId.current += 1;
      discussionRequestId.current += 1;

      setLoading(true);
      setError("");
      setResearch(null);
      setConversationId(id);
      setMessages([]);
      setDiscussionInput("");
      setDiscussionResponse(null);
      setShowPlanAction(false);

      try {
        const conversation = await getResearchConversation(id);

        if (disposed || requestId !== researchRequestId.current) return;

        const storedMessages = conversation.messages ?? [];

        const explorationMessage = storedMessages.find(
          (message) =>
            message.kind === "explore" &&
            message.role === "assistant"
        );

        let candidate: unknown = explorationMessage?.payload;

        if (
          candidate &&
          typeof candidate === "object" &&
          "research" in candidate
        ) {
          candidate = (candidate as { research: unknown }).research;
        } else if (
          candidate &&
          typeof candidate === "object" &&
          "result" in candidate
        ) {
          candidate = (candidate as { result: unknown }).result;
        }

        if (
          !candidate ||
          typeof candidate !== "object" ||
          !("question" in candidate)
        ) {
          throw new Error(
            "This conversation does not contain a restorable research exploration."
          );
        }

        const firstUserMessage = storedMessages.find(
          (message) =>
            message.kind === "explore" &&
            message.role === "user"
        );

        const candidateQuestion = (
          candidate as { question?: unknown }
        ).question;

        const restoredQuestion =
          typeof candidateQuestion === "string"
            ? candidateQuestion
            : firstUserMessage?.content ?? conversation.title;

        const restoredResearch = {
          ...(candidate as Record<string, unknown>),
          question: restoredQuestion,
          conversation_id: conversation.id,
        } as ResearchExploration;

        const restoredMessages: ResearchDiscussionMessage[] =
          storedMessages
            .filter((message) => message.kind === "discuss")
            .map((message) => ({
              role: message.role,
              content: message.content,
            }));

        const lastDiscussionResponse = [...storedMessages]
          .reverse()
          .find(
            (message) =>
              message.kind === "discuss" &&
              message.role === "assistant"
          );

        const responsePayload = lastDiscussionResponse?.payload;

        const restoredDiscussionResponse =
          responsePayload &&
          typeof responsePayload.answer === "string"
            ? (responsePayload as unknown as ResearchDiscussionResponse)
            : null;

        const hasSavedPlan = storedMessages.some(
          (message) =>
            message.role === "assistant" &&
            message.kind === "plan" &&
            message.payload !== null &&
            typeof message.payload === "object"
        );

        setQuestion(restoredQuestion);
        setResearch(restoredResearch);
        setConversationId(conversation.id);
        setMessages(restoredMessages);
        setDiscussionResponse(restoredDiscussionResponse);
        setDiscussionInput("");
        setShowPlanAction(hasSavedPlan);

        window.localStorage.setItem(
          LAST_EXPLORATION_KEY,
          JSON.stringify(restoredResearch)
        );

        window.dispatchEvent(
          new CustomEvent("scholargraph:conversation-active", {
            detail: { conversationId: conversation.id },
          })
        );
      } catch (err) {
        if (disposed || requestId !== researchRequestId.current) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to open this saved conversation."
        );
      } finally {
        if (!disposed && requestId === researchRequestId.current) {
          setLoading(false);
        }
      }
    }

    function handleNewResearch() {
      researchRequestId.current += 1;
      planRequestId.current += 1;
      discussionRequestId.current += 1;

      setQuestion("");
      setResearch(null);
      setConversationId(null);
      setMessages([]);
      setDiscussionInput("");
      setDiscussionResponse(null);
      setLoading(false);
      setDiscussionLoading(false);
      setPlanLoading(false);
      setError("");
      setShowPlanAction(false);

      window.dispatchEvent(
        new CustomEvent("scholargraph:conversation-active", {
          detail: { conversationId: null },
        })
      );
    }

    function handlePopState() {
      const id = new URLSearchParams(
        window.location.search
      ).get("conversationId");

      if (id) {
        void handleOpenConversation(
          new CustomEvent("scholargraph:open-conversation", {
            detail: { conversationId: id },
          })
        );
      } else {
        handleNewResearch();
      }
    }

    window.addEventListener(
      "scholargraph:new-research",
      handleNewResearch
    );

    window.addEventListener(
      "scholargraph:open-conversation",
      handleOpenConversation
    );

    window.addEventListener("popstate", handlePopState);

    // Restore a saved conversation on direct navigation or page refresh.
    const requestedConversationId = new URLSearchParams(
      window.location.search
    ).get("conversationId");

    if (requestedConversationId) {
      void handleOpenConversation(
        new CustomEvent("scholargraph:open-conversation", {
          detail: {
            conversationId: requestedConversationId,
          },
        })
      );
    }

    return () => {
      disposed = true;

      window.removeEventListener(
        "scholargraph:new-research",
        handleNewResearch
      );

      window.removeEventListener(
        "scholargraph:open-conversation",
        handleOpenConversation
      );

      window.removeEventListener("popstate", handlePopState);

      researchRequestId.current += 1;
      planRequestId.current += 1;
      discussionRequestId.current += 1;
    };
  }, []);


  async function handleResearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = question.trim();

    if (!trimmed) {
      setError("Enter a research question first.");
      return;
    }

    const requestId = ++researchRequestId.current;

    // This is a new exploration, so it must not reuse an old conversation.
    planRequestId.current += 1;
    discussionRequestId.current += 1;

    setLoading(true);
    setError("");
    setResearch(null);
    setConversationId(null);
    setMessages([]);
    setDiscussionInput("");
    setDiscussionResponse(null);
    setPlanLoading(false);
    setDiscussionLoading(false);
    setShowPlanAction(false);

    try {
      // No conversation ID means the backend creates a new conversation.
      const result = await exploreResearch(trimmed, null);

      if (requestId !== researchRequestId.current) {
        return;
      }

      if (
        typeof result.question === "string" &&
        result.question.trim() !== trimmed
      ) {
        console.warn(
          "[Research Debug] API returned a different question.",
          {
            submitted: trimmed,
            returned: result.question,
          }
        );
      }

      const savedResearch: ResearchExploration = {
        ...result,
        question: trimmed,
      };

      setResearch(savedResearch);

      // Store the ID returned by the backend for subsequent operations.
      const returnedConversationId =
        result.conversation_id ?? null;

      setConversationId(returnedConversationId);

      window.localStorage.setItem(
        LAST_EXPLORATION_KEY,
        JSON.stringify(savedResearch)
      );

      setShowPlanAction(true);
    } catch (err) {
      if (requestId !== researchRequestId.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to explore this research question."
      );
    } finally {
      if (requestId === researchRequestId.current) {
        setLoading(false);
      }
    }
  }

  async function handleDiscussion(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const currentResearch = research;

    if (!currentResearch) {
      return;
    }

    const prompt = discussionInput.trim();

    if (!prompt) {
      return;
    }

    const requestId = ++discussionRequestId.current;
    const existingMessages = [...messages];

    const userMessage: ResearchDiscussionMessage = {
      role: "user",
      content: prompt,
    };

    const nextMessages = [
      ...existingMessages,
      userMessage,
    ];

    setMessages(nextMessages);
    setDiscussionInput("");
    setDiscussionLoading(true);
    setError("");

    try {
      const response = await discussResearch({
        question: currentResearch.question,
        research: currentResearch,
        messages: existingMessages,
        prompt,
        conversation_id:
          conversationId ??
          currentResearch.conversation_id ??
          null,
      });

      if (requestId !== discussionRequestId.current) {
        return;
      }

      // Keep the active conversation ID in sync with the backend.
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: ResearchDiscussionMessage = {
        role: "assistant",
        content: response.answer,
      };

      setMessages([
        ...nextMessages,
        assistantMessage,
      ]);

      setDiscussionResponse(response);
    } catch (err) {
      if (requestId !== discussionRequestId.current) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to continue the research discussion."
      );
    } finally {
      if (requestId === discussionRequestId.current) {
        setDiscussionLoading(false);
      }
    }
  }

 
async function handleBuildPlan() {
  const currentResearch = research;

  if (!currentResearch || planLoading) {
    return;
  }

  const expectedQuestion = currentResearch.question.trim();
  const requestId = ++planRequestId.current;

  setPlanLoading(true);
  setError("");

  try {
    const plan = await generateResearchPlan({
      question: expectedQuestion,
      experience_level: "beginner",
      hours_per_week: 10,
      conversation_id:
        conversationId ??
        currentResearch.conversation_id ??
        null,
    });

    console.info("[Plan Debug] API returned:", {
      question: plan.question,
      conversationId: plan.conversation_id,
      firstTask: plan.daily_tasks?.[0]?.title,
      firstMilestone: plan.milestones?.[0]?.title,
    });

    // Ignore a stale response if another research flow started.
    if (requestId !== planRequestId.current) {
      return;
    }

    if (
      typeof plan.question !== "string" ||
      plan.question.trim() !== expectedQuestion
    ) {
      console.error("[Planner Debug] Question mismatch:", {
        expected: expectedQuestion,
        returned: plan.question,
      });

      setError(
        "The generated plan does not match your current research question. Please try building it again."
      );
      return;
    }

    const activeConversationId =
      plan.conversation_id ??
      conversationId ??
      currentResearch.conversation_id ??
      null;

    if (!activeConversationId) {
      setError(
        "The plan was generated, but no conversation ID was returned. Please reopen your research conversation and try again."
      );
      return;
    }

    const savedPlan = {
      ...plan,
      conversation_id: activeConversationId,
    };

    setConversationId(activeConversationId);

    // Keep a cache for direct navigation, but load from the database
    // whenever a conversation ID is provided.
    window.localStorage.setItem(
      "scholargraph:last-plan",
      JSON.stringify(savedPlan)
    );

    console.info("[Planner Debug] Saved plan cache:", {
      question: savedPlan.question,
      conversationId: savedPlan.conversation_id,
    });

    // The Planner will fetch the latest saved plan for this conversation.
    window.location.assign(
      `/planner?conversationId=${encodeURIComponent(activeConversationId)}`
    );
  } catch (err) {
    if (requestId !== planRequestId.current) {
      return;
    }

    setError(
      err instanceof Error
        ? err.message
        : "Unable to build the research plan."
    );
  } finally {
    if (requestId === planRequestId.current) {
      setPlanLoading(false);
    }
  }
}

function handleViewPlan() {
  const id =
    conversationId ?? research?.conversation_id ?? null;

  if (!id) {
    setError(
      "No saved conversation ID is available for this plan."
    );
    return;
  }

  window.location.assign(
    `/planner?conversationId=${encodeURIComponent(id)}`
  );
}


  function resetResearch() {
    researchRequestId.current += 1;
    planRequestId.current += 1;
    discussionRequestId.current += 1;

    setQuestion("");
    setResearch(null);
    setConversationId(null);
    setMessages([]);
    setDiscussionInput("");
    setDiscussionResponse(null);
    setLoading(false);
    setDiscussionLoading(false);
    setPlanLoading(false);
    setError("");
    setShowPlanAction(false);
  }

  if (!research) {
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 lg:px-10 lg:pt-20">
          <section className="mx-auto max-w-4xl">
            <div className="mb-8 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0d0f14]">
                <FlaskConical
                  size={21}
                  strokeWidth={1.6}
                  className="text-[#b6a9ff]"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#666a75]">
                Research workspace
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-[54px]">
                What are you researching?
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#7d818c] sm:text-base">
                Start with a question. Explore the evidence,
                understand what is already known, challenge
                the direction, and decide what is worth building.
              </p>
            </div>

            <form
              onSubmit={handleResearch}
              className="mt-10"
            >
              <div className="rounded-2xl border border-white/[0.09] bg-[#0d0f14] p-2 shadow-2xl shadow-black/20">
                <textarea
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);
                    setError("");
                  }}
                  rows={5}
                  placeholder="e.g. Can thermal imaging improve weapon detection in crowded environments?"
                  className="w-full resize-none bg-transparent px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-[#50545e]"
                />

                <div className="flex flex-col gap-3 border-t border-white/[0.06] px-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="px-2 text-xs text-[#555963]">
                    ScholarGraph starts with exploration, not a plan.
                  </p>

                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b6a9ff] px-5 py-2.5 text-sm font-medium text-[#0b0b0f] transition hover:bg-[#c4baff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <RefreshCw
                          size={14}
                          className="animate-spin"
                        />
                        Exploring
                      </>
                    ) : (
                      <>
                        Explore research
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
                <TriangleAlert
                  size={16}
                  className="mt-0.5 shrink-0"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Explore",
                  text: "Understand the problem and existing research.",
                },
                {
                  icon: MessageCircle,
                  title: "Discuss",
                  text: "Question assumptions and investigate gaps.",
                },
                {
                  icon: Target,
                  title: "Decide",
                  text: "Turn the direction into a research plan.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5"
                >
                  <item.icon
                    size={16}
                    className="text-[#77708f]"
                  />

                  <p className="mt-4 text-sm font-medium text-[#d1d3d8]">
                    {item.title}
                  </p>

                  <p className="mt-1.5 text-xs leading-5 text-[#666a75]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <header className="border-b border-white/[0.07] pb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#626670]">
                Research exploration
              </p>

              <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
                {research.question}
              </h1>
            </div>

            <button
              type="button"
              onClick={resetResearch}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs text-[#858994] transition hover:border-white/[0.14] hover:text-white"
            >
              <X size={13} />
              New research
            </button>

{showPlanAction && (
  <button
    type="button"
    onClick={handleViewPlan}
    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[0.08] px-3.5 py-2 text-xs text-violet-200 transition hover:bg-violet-300/[0.15]"
  >
    <BookOpen size={13} />
    View Plan
  </button>
 )}

          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-[#888c97]">
              Exploration
            </span>

            <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-[#888c97]">
              {research.recent_papers.length} recent papers
            </span>

            <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-[#888c97]">
              {research.datasets.length} datasets
            </span>

            <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-[#888c97]">
              {research.books.length} books
            </span>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b6a9ff]/10">
              <Brain
                size={17}
                className="text-[#b6a9ff]"
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#626670]">
                Starting point
              </p>

              <h2 className="mt-1 text-sm font-medium text-white">
                What the research is about
              </h2>
            </div>
          </div>

          <p className="mt-5 max-w-4xl text-sm leading-7 text-[#a8abb5]">
            {research.understanding}
          </p>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ResearchSection
            title="Research scope"
            icon={Target}
            items={research.research_scope}
          />

          <ResearchSection
            title="Key concepts"
            icon={Lightbulb}
            items={research.key_concepts}
          />

          <ResearchSection
            title="Established approaches"
            icon={CheckCircle2}
            items={research.established_approaches}
          />

          <ResearchSection
            title="Current challenges"
            icon={TriangleAlert}
            items={research.challenges}
          />

          <ResearchSection
            title="Possible research directions"
            icon={ArrowRight}
            items={research.research_directions}
          />

          <ResearchSection
            title="Potential gaps"
            icon={Search}
            items={research.research_gaps}
          />
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#626670]">
                Evidence
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Research material
              </h2>

              <p className="mt-1 text-sm text-[#70747f]">
                Sources to investigate before deciding where to go next.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <ResourceSummary
              icon={BookOpen}
              title="Papers"
              count={
                research.foundational_papers.length +
                research.recent_papers.length
              }
              href={`/papers?query=${encodeURIComponent(
                research.question
              )}`}
            />

            <ResourceSummary
              icon={Database}
              title="Datasets"
              count={research.datasets.length}
              href={`/datasets?query=${encodeURIComponent(
                research.question
              )}`}
            />

            <ResourceSummary
              icon={BookOpen}
              title="Books & resources"
              count={research.books.length}
              href={`/library?query=${encodeURIComponent(
                research.question
              )}`}
            />
          </div>
        </section>

        {research.recent_papers.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#626670]">
                  Literature
                </p>

                <h2 className="mt-2 text-lg font-medium text-white">
                  Recent research
                </h2>
              </div>

              <Link
                href={`/papers?query=${encodeURIComponent(
                  research.question
                )}`}
                className="text-xs text-[#8178aa] hover:text-white"
              >
                View all
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {research.recent_papers
                .slice(0, 4)
                .map((paper) => (
                  <PaperCard
                    key={`${paper.title}-${paper.year}`}
                    paper={paper}
                  />
                ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#626670]">
                Research discussion
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Investigate the question further
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#70747f]">
                Ask why an approach fails, what evidence supports a claim,
                what is missing, or how you could test an idea.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-4 sm:p-5">
            {messages.length > 0 && (
              <div className="mb-5 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-2xl rounded-2xl bg-white/[0.06] p-4"
                        : "max-w-3xl rounded-2xl border border-white/[0.06] bg-[#101218] p-4"
                    }
                  >
                    <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-[#5f636e]">
                      {message.role === "user"
                        ? "You"
                        : "ScholarGraph"}
                    </p>

                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#aeb1bb]">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleDiscussion}
              className="rounded-xl border border-white/[0.07] bg-[#090b0f] p-2"
            >
              <textarea
                value={discussionInput}
                onChange={(event) =>
                  setDiscussionInput(event.target.value)
                }
                rows={3}
                placeholder="Ask a follow-up question..."
                className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-[#50545e]"
              />

              <div className="flex justify-end border-t border-white/[0.05] pt-2">
                <button
                  type="submit"
                  disabled={
                    discussionLoading ||
                    !discussionInput.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-[#b6a9ff] px-4 py-2 text-xs font-medium text-[#0b0b0f] transition hover:bg-[#c4baff] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {discussionLoading ? (
                    <>
                      <RefreshCw
                        size={12}
                        className="animate-spin"
                      />
                      Thinking
                    </>
                  ) : (
                    <>
                      Discuss
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {discussionResponse?.suggested_questions?.length ? (
              <div className="mt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-[#5d616c]">
                  Continue investigating
                </p>

                <div className="flex flex-wrap gap-2">
                  {discussionResponse.suggested_questions.map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setDiscussionInput(suggestion)
                        }
                        className="rounded-full border border-white/[0.07] px-3 py-2 text-left text-xs text-[#858994] transition hover:border-white/[0.14] hover:text-white"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-2xl border border-[#b6a9ff]/15 bg-[#b6a9ff]/[0.035] p-6 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8278a7]">
                  Ready for the next step?
                </p>

                <h2 className="mt-2 text-lg font-medium text-white">
                  Turn this exploration into a research plan
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7e818c]">
                  Once you understand the problem and have questioned the
                  direction, ScholarGraph can turn it into milestones,
                  learning topics, resources, and daily tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBuildPlan}
                disabled={planLoading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#b6a9ff] px-5 py-3 text-sm font-medium text-[#0b0b0f] transition hover:bg-[#c4baff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {planLoading ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                    Building
                  </>
                ) : (
                  <>
                    Build research plan
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
            <TriangleAlert
              size={16}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}
      </main>
    </AppShell>
  );
}
