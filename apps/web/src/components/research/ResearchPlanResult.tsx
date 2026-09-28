import type { ResearchPlan } from "@/lib/researchApi";

type ResearchPlanResultProps = {
  plan: ResearchPlan;
};

export default function ResearchPlanResult({
  plan,
}: ResearchPlanResultProps) {
  return (
    <section className="mt-8 space-y-4">

      {/* Understanding */}

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[#777b85]">
            Research direction
          </p>

          <h2 className="mt-2 text-lg font-medium text-white">
            {plan.question}
          </h2>
        </div>

        <div>
          <p className="text-sm font-medium text-[#d7d8dc]">
            Understanding
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8b8f9a]">
            {plan.understanding}
          </p>
        </div>
      </div>


      {/* Learning path */}

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 sm:p-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.12em] text-[#777b85]">
            Learning path
          </p>

          <h2 className="mt-2 text-lg font-medium text-white">
            What you should understand first
          </h2>

          <p className="mt-1 text-sm text-[#666a74]">
            Each topic is connected to resources you can study.
          </p>
        </div>

        <div className="space-y-4">
          {plan.learning_path.map((item, index) => (
            <div
              key={item.topic}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex gap-4">

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-xs text-[#9b8cff]">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-medium text-[#d7d8dc]">
                      {item.topic}
                    </h3>

                    <span className="text-xs text-[#666a74]">
                      ~{item.estimated_hours}h
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#80848e]">
                    {item.why_it_matters}
                  </p>

                  <div className="mt-4 space-y-2">
                    {item.resources.map((resource) => (
                      <div
                        key={resource.title}
                        className="rounded-lg border border-white/[0.05] bg-black/10 p-3"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs font-medium text-[#bfc1c7]">
                            {resource.title}
                          </span>

                          <span className="text-[10px] uppercase tracking-wide text-[#666a74]">
                            {resource.resource_type}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-[#70747f]">
                          {resource.description}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Papers */}

      <div className="grid gap-4 lg:grid-cols-2">

        {/* Foundational */}

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[#777b85]">
              Literature
            </p>

            <h2 className="mt-2 text-base font-medium text-white">
              Foundational papers
            </h2>

            <p className="mt-1 text-xs text-[#666a74]">
              Start here to understand the research foundations.
            </p>
          </div>

          <div className="space-y-3">
            {plan.foundational_papers.map((paper) => (
              <PaperCard
                key={paper.title}
                paper={paper}
              />
            ))}
          </div>
        </div>


        {/* Recent */}

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[#777b85]">
              Current research
            </p>

            <h2 className="mt-2 text-base font-medium text-white">
              Recent papers
            </h2>

            <p className="mt-1 text-xs text-[#666a74]">
              Recent work to understand current directions.
            </p>
          </div>

          <div className="space-y-3">
            {plan.recent_papers.map((paper) => (
              <PaperCard
                key={paper.title}
                paper={paper}
              />
            ))}
          </div>
        </div>

      </div>


      {/* Datasets */}

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[#777b85]">
            Data
          </p>

          <h2 className="mt-2 text-base font-medium text-white">
            Datasets & benchmarks
          </h2>
        </div>

        <div className="space-y-3">
          {plan.datasets.map((dataset) => (
            <div
              key={dataset.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-medium text-[#c5c7cc]">
                  {dataset.title}
                </h3>

                <span className="text-[10px] uppercase tracking-wide text-[#666a74]">
                  {dataset.resource_type}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[#70747f]">
                {dataset.description}
              </p>
            </div>
          ))}
        </div>
      </div>


      {/* Milestones */}

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f14] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[#777b85]">
            Research roadmap
          </p>

          <h2 className="mt-2 text-base font-medium text-white">
            From understanding to experimentation
          </h2>
        </div>

        <div className="space-y-3">
          {plan.milestones.map((milestone, index) => (
            <div
              key={milestone.title}
              className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-xs text-[#9b8cff]">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-medium text-[#d7d8dc]">
                    {milestone.title}
                  </h3>

                  <span className="shrink-0 text-xs text-[#666a74]">
                    ~{milestone.estimated_hours}h
                  </span>
                </div>

                <p className="mt-1.5 text-sm leading-6 text-[#80848e]">
                  {milestone.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}


function PaperCard({
  paper,
}: {
  paper: ResearchPlan["foundational_papers"][number];
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-5 text-[#c5c7cc]">
          {paper.title}
        </h3>

        <span className="shrink-0 text-xs text-[#666a74]">
          {paper.year}
        </span>
      </div>

      <p className="mt-2 text-xs text-[#666a74]">
        {paper.authors.join(", ")}
      </p>

      <p className="mt-2 text-xs leading-5 text-[#70747f]">
        {paper.description}
      </p>

      {paper.url && (
        <a
          href={paper.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-xs text-[#9b8cff] hover:text-[#b4abff]"
        >
          Read paper →
        </a>
      )}

    </div>
  );
}