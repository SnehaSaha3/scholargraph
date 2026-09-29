"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Database,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import ResearchPlanResult from "@/components/research/ResearchPlanResult";
import {
  generateResearchPlan,
  type ResearchPlan,
} from "@/lib/researchApi";

const suggestions = [
  "Help me understand multimodal AI research",
  "How do I start a research project on medical AI?",
  "Find recent research directions in computer vision",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [researchPlan, setResearchPlan] =
    useState<ResearchPlan | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleResearch() {
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setResearchPlan(null);

    try {
      const plan = await generateResearchPlan({
        question: question.trim(),
        experience_level: "beginner",
        hours_per_week: 10,
      });
    setResearchPlan(plan);

     localStorage.setItem(
     "scholargraph:last-plan",
      JSON.stringify(plan)
    );
    } catch (error) {
      console.error(error);

      setError(
        "We couldn't generate the research plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestion(suggestion: string) {
    setQuestion(suggestion);
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 md:pt-16">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#282533] bg-[#0e0d14] px-3 py-1.5 text-xs text-[#a9a1c7]">
            <Sparkles size={13} />
            Your research workspace
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Think deeper.
            <br />
            <span className="text-[#9b8cff]">Research smarter.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#818590] md:text-base">
            ScholarGraph helps you understand a domain, discover research,
            explore datasets, challenge your ideas and turn questions into
            structured projects.
          </p>
        </div>

        {/* Research terminal */}
        <div className="rounded-2xl border border-[#282b34] bg-[#0d0f14] p-3 shadow-2xl shadow-black/20">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.metaKey || event.ctrlKey)
              ) {
                handleResearch();
              }
            }}
            placeholder="What are you researching?"
            className="min-h-32 w-full resize-none bg-transparent p-4 text-base text-white outline-none placeholder:text-[#555965]"
          />

          <div className="flex flex-col gap-3 border-t border-[#20232b] pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setQuestion(
                    "Help me understand a research domain and its fundamentals"
                  )
                }
                className="rounded-lg bg-[#151821] px-3 py-2 text-xs text-[#969aa5] hover:text-white"
              >
                Explore a domain
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuestion(
                    "Find important research directions and existing approaches in this field"
                  )
                }
                className="rounded-lg bg-[#151821] px-3 py-2 text-xs text-[#969aa5] hover:text-white"
              >
                Find research
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuestion(
                    "Help me brainstorm research ideas around this topic"
                  )
                }
                className="rounded-lg bg-[#151821] px-3 py-2 text-xs text-[#969aa5] hover:text-white"
              >
                Brainstorm
              </button>
            </div>

            <button
              type="button"
              onClick={handleResearch}
              disabled={loading || !question.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#9b8cff] px-4 py-2.5 text-sm font-medium text-black transition hover:bg-[#aa9dff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Researching..." : "Research"}

              {!loading && <ArrowUpRight size={15} />}
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="mt-2 text-right text-[10px] text-[#4f535d]">
          Press ⌘ Enter to research
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Suggestions */}
        <div className="mt-5 space-y-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestion(suggestion)}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[#6f737e] transition hover:bg-white/[0.025] hover:text-[#a8abb5]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Research result */}
        {researchPlan && (
          <ResearchPlanResult plan={researchPlan} />
        )}

        {/* Quick cards */}
        {!researchPlan && (
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            <QuickCard
              icon={<BookOpen size={18} />}
              title="Research Library"
              description="Find books, papers and useful reading material."
              href="/library"
            />

            <QuickCard
              icon={<Database size={18} />}
              title="Dataset Explorer"
              description="Discover datasets and understand what they contain."
              href="/datasets"
            />

            <QuickCard
              icon={<Lightbulb size={18} />}
              title="Project Planner"
              description="Turn an idea into milestones, tasks and a schedule."
              href="/planner"
            />
          </div>
        )}
      </section>
    </AppShell>
  );
}

function QuickCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#20232b] bg-[#0c0e13] p-5 transition hover:border-[#393344] hover:bg-[#101219]"
    >
      <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
        {icon}
      </div>

      <h3 className="text-sm font-medium">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-[#70747f]">
        {description}
      </p>

      <div className="mt-5 text-xs text-[#9b8cff] opacity-0 transition group-hover:opacity-100">
        Explore →
      </div>
    </Link>
  );
}