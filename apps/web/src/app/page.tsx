"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  FlaskConical,
  Lightbulb,
  Search,
  Target,
  TriangleAlert,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  ResearchPlan,
  generateResearchPlan,
} from "@/lib/researchApi";

function Section({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Search;
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171522]">
          <Icon className="h-4 w-4 text-[#9b8cff]" />
        </div>

        <h2 className="text-sm font-semibold text-white">
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="flex gap-3 text-sm leading-6 text-[#b8bac4]"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#686273]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceCard({
  title,
  count,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  count: number;
  description: string;
  icon: typeof BookOpen;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#171522]">
          <Icon className="h-4 w-4 text-[#9b8cff]" />
        </div>

        <span className="text-xs text-[#777985]">
          {count} results
        </span>
      </div>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#888b97]">
        {description}
      </p>

      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#9b8cff] transition hover:text-white"
      >
        View more
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default function ResearchPage() {
  const [question, setQuestion] = useState("");

  const [research, setResearch] =
    useState<ResearchPlan | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleResearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a research question.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await generateResearchPlan({
        question: trimmedQuestion,
        experience_level: "beginner",
        hours_per_week: 10,
      });

      setResearch(result);

      localStorage.setItem(
        "scholargraph:last-plan",
        JSON.stringify(result)
      );
    } catch (err) {
      console.error(
        "ScholarGraph research error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to research this question."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNewResearch() {
    setResearch(null);
    setQuestion("");
    setError("");
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-12">
        {!research && (
          <section className="mx-auto max-w-4xl pt-10 text-center lg:pt-16">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#272a33] bg-[#0d0f14]">
              <FlaskConical className="h-5 w-5 text-[#9b8cff]" />
            </div>

            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777985]">
              Research workspace
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              What are you researching?
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#888b97] sm:text-base">
              Explore a research problem, understand its scope,
              discover evidence, identify possible directions,
              and turn it into a research plan.
            </p>

            <form
              onSubmit={handleResearch}
              className="mx-auto mt-10"
            >
              <div className="rounded-2xl border border-[#30333d] bg-[#0d0f14] p-2 shadow-2xl shadow-black/20">
                <textarea
                  value={question}
                  onChange={(event) => {
                    setQuestion(event.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  rows={4}
                  placeholder="Ask a research question..."
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#5f616b]"
                />

                <div className="flex items-center justify-between border-t border-[#242730] px-2 pt-2">
                  <span className="px-2 text-xs text-[#5f616b]">
                    ScholarGraph will investigate the question
                  </span>

                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#9b8cff] px-4 py-2.5 text-sm font-medium text-[#0b0b0f] transition hover:bg-[#afa3ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      "Researching..."
                    ) : (
                      <>
                        Research
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-sm text-red-300">
                {error}
              </div>
            )}
          </section>
        )}

        {research && (
          <div className="space-y-8">
            {/* Research header */}
            <section>
              <button
                type="button"
                onClick={handleNewResearch}
                className="mb-6 text-xs text-[#777985] transition hover:text-white"
              >
                ← New research question
              </button>

              <div className="max-w-4xl">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777985]">
                  Research brief
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {research.question}
                </h1>

                <p className="mt-5 max-w-4xl text-sm leading-7 text-[#a5a7b1]">
                  {research.understanding}
                </p>
              </div>
            </section>

            {/* Scope + concepts */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Section
                icon={Target}
                title="Research scope"
                items={research.research_scope}
              />

              <Section
                icon={Lightbulb}
                title="Key concepts"
                items={research.key_concepts}
              />
            </div>

            {/* Established approaches */}
            <Section
              icon={CheckCircle2}
              title="Established approaches"
              items={research.established_approaches}
            />

            {/* Challenges */}
            <Section
              icon={TriangleAlert}
              title="Challenges"
              items={research.challenges}
            />

            {/* Directions */}
            <Section
              icon={Lightbulb}
              title="Potential research directions"
              items={research.research_directions}
            />

            {/* Gaps */}
            <Section
              icon={Search}
              title="Potential research gaps"
              items={research.research_gaps}
            />

            {/* Evidence */}
            <section>
              <div className="mb-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777985]">
                  Evidence
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Explore the research material
                </h2>

                <p className="mt-2 text-sm text-[#888b97]">
                  Resources retrieved while investigating this
                  question.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <EvidenceCard
                  title="Papers"
                  count={
                    research.foundational_papers.length +
                    research.recent_papers.length
                  }
                  description="Foundational and recent literature relevant to the research question."
                  icon={Search}
                  href="#"
                />

                <EvidenceCard
                  title="Books"
                  count={research.books.length}
                  description="Books and foundational material discovered through the research workflow."
                  icon={BookOpen}
                  href={`/library?query=${encodeURIComponent(
                    research.question
                  )}`}
                />

                <EvidenceCard
                  title="Datasets"
                  count={research.datasets.length}
                  description="Datasets that can support investigation and experimentation."
                  icon={Database}
                  href={`/datasets?query=${encodeURIComponent(
                    research.question
                  )}`}
                />
              </div>
            </section>

            {/* Planner CTA */}
            <section className="rounded-2xl border border-[#332f4b] bg-[#11101a] p-6 sm:p-8">
              <div className="max-w-2xl">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#777985]">
                  Next step
                </p>

                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Ready to investigate this?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#999ba5]">
                  Turn this research question into an
                  executable learning and research plan with
                  milestones, resources, experiments and daily
                  work.
                </p>

                <Link
                  href="/planner"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#9b8cff] px-5 py-3 text-sm font-medium text-[#0b0b0f] transition hover:bg-[#afa3ff]"
                >
                  Build research plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}