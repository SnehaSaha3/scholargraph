"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  ListChecks,
} from "lucide-react";

import type {
  ResearchPlan,
  ResearchResource,
} from "@/lib/researchApi";


type ResearchPlanResultProps = {
  plan: ResearchPlan;
};


export default function ResearchPlanResult({
  plan,
}: ResearchPlanResultProps) {

  return (
    <section className="mt-12 space-y-5">

      {/* Understanding */}

      <div className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
            <FileText size={16} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#656974]">
              Research framing
            </p>

            <h2 className="mt-1 text-sm font-medium text-white">
              How to approach the problem
            </h2>
          </div>

        </div>

        <p className="mt-5 text-sm leading-7 text-[#999da8]">
          {plan.understanding}
        </p>

      </div>


      {/* Topics */}

      <div className="grid gap-5 lg:grid-cols-2">

        <section className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5">

          <SectionHeader
            icon={<ListChecks size={16} />}
            eyebrow="Foundation"
            title="What you need first"
          />

          <div className="mt-5 space-y-2">

            {plan.prerequisites.map(
              (item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex gap-3 rounded-lg bg-white/[0.025] px-3 py-3"
                >
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0 text-[#6e687f]"
                  />

                  <span className="text-xs leading-5 text-[#9a9da7]">
                    {item}
                  </span>
                </div>
              )
            )}

          </div>

        </section>


        <section className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5">

          <SectionHeader
            icon={<BookOpen size={16} />}
            eyebrow="Learning path"
            title="What to study"
          />

          <div className="mt-5 space-y-3">

            {plan.learning_path.map(
              (topic, index) => (
                <div
                  key={`${topic.topic}-${index}`}
                  className="rounded-lg border border-white/[0.05] p-3"
                >

                  <div className="flex items-start justify-between gap-3">

                    <h3 className="text-xs font-medium text-[#d1d3d8]">
                      {topic.topic}
                    </h3>

                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#60646f]">
                      <Clock3 size={11} />
                      {topic.estimated_hours}h
                    </span>

                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-[#747883]">
                    {topic.why_it_matters}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

      </div>


      {/* Papers */}

      <ResourceSection
        title="Research literature"
        eyebrow="Papers"
        icon={<FileText size={16} />}
        resources={[
          ...plan.foundational_papers,
          ...plan.recent_papers,
        ].map((paper) => ({
          title: paper.title,
          description: paper.description,
          resource_type:
            paper.year < 2022
              ? "Foundational paper"
              : `${paper.year} paper`,
          url: paper.url,
        }))}
      />


      {/* Books */}

      <ResourceSection
        title="Books to ground the work"
        eyebrow="Library"
        icon={<BookOpen size={16} />}
        resources={plan.books}
        showCovers
      />


      {/* Datasets */}

      <ResourceSection
        title="Datasets to investigate"
        eyebrow="Data"
        icon={<Database size={16} />}
        resources={plan.datasets}
      />


      {/* Milestones */}

      <section className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">

        <SectionHeader
          icon={<ListChecks size={16} />}
          eyebrow="Research development"
          title="Milestones"
        />

        <div className="mt-5 space-y-3">

          {plan.milestones.map(
            (milestone, index) => (
              <div
                key={`${milestone.title}-${index}`}
                className="flex gap-4 rounded-xl border border-white/[0.05] p-4"
              >

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-[10px] text-[#777b85]">
                  {index + 1}
                </div>

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-3">

                    <h3 className="text-sm font-medium text-[#d5d6dc]">
                      {milestone.title}
                    </h3>

                    <span className="text-[10px] text-[#5e626d]">
                      {milestone.estimated_hours}h
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-6 text-[#747883]">
                    {milestone.description}
                  </p>

                </div>

              </div>
            )
          )}

        </div>

      </section>


      {/* Daily track */}

      <section className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <SectionHeader
            icon={<CheckCircle2 size={16} />}
            eyebrow="Research track"
            title="Your first 14 days"
          />

          <Link
            href="/planner"
            className="inline-flex items-center gap-1.5 text-xs text-[#9b8cff] hover:text-white"
          >
            Open full planner
            <ArrowUpRight size={13} />
          </Link>

        </div>

        <div className="mt-5 space-y-2">

          {plan.daily_tasks
            .slice(0, 5)
            .map((task) => (
              <div
                key={task.day}
                className="flex items-start gap-3 rounded-lg bg-white/[0.025] px-3 py-3"
              >

                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-[9px] text-[#626671]">
                  {task.day}
                </span>

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-medium text-[#c7c9cf]">
                    {task.title}
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-[#6f737e]">
                    {task.description}
                  </p>

                </div>

                <span className="shrink-0 text-[10px] text-[#555963]">
                  {task.estimated_minutes}m
                </span>

              </div>
            ))}

        </div>

      </section>

    </section>
  );
}


function SectionHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {

  return (
    <div className="flex items-center gap-3">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
        {icon}
      </div>

      <div>

        <p className="text-[10px] uppercase tracking-[0.16em] text-[#656974]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-sm font-medium text-white">
          {title}
        </h2>

      </div>

    </div>
  );
}


function ResourceSection({
  eyebrow,
  title,
  icon,
  resources,
  showCovers = false,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  resources: ResearchResource[];
  showCovers?: boolean;
}) {

  if (!resources.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">

      <SectionHeader
        icon={icon}
        eyebrow={eyebrow}
        title={title}
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">

        {resources.slice(0, 8).map(
          (resource, index) => {

            const content = (
              <div className="flex gap-3">

                {showCovers && (
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-white/[0.04]">

                    {resource.cover_url ? (
                      <img
                        src={resource.cover_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen
                          size={15}
                          className="text-[#555963]"
                        />
                      </div>
                    )}

                  </div>
                )}

                <div className="min-w-0 flex-1">

                  <div className="flex items-start gap-2">

                    <h3 className="min-w-0 flex-1 text-xs font-medium leading-5 text-[#c9cbd1]">
                      {resource.title}
                    </h3>

                    {resource.url && (
                      <ExternalLink
                        size={12}
                        className="mt-0.5 shrink-0 text-[#555963]"
                      />
                    )}

                  </div>

                  <p className="mt-1 text-[10px] leading-5 text-[#6d717c]">
                    {resource.description}
                  </p>

                  <span className="mt-2 inline-block text-[9px] uppercase tracking-[0.1em] text-[#535762]">
                    {resource.resource_type}
                  </span>

                </div>

              </div>
            );

            if (!resource.url) {
              return (
                <div
                  key={`${resource.title}-${index}`}
                  className="rounded-xl border border-white/[0.05] p-4"
                >
                  {content}
                </div>
              );
            }

            return (
              <a
                key={`${resource.title}-${index}`}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/[0.05] p-4 transition hover:border-[#393344] hover:bg-white/[0.015]"
              >
                {content}
              </a>
            );
          }
        )}

      </div>

    </section>
  );
}