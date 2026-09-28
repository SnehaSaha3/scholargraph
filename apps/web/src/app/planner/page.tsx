import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const tasks = [
  {
    day: "Today",
    title: "Define research question",
    type: "Research",
    time: "45 min",
    done: true,
  },
  {
    day: "Today",
    title: "Read foundational paper",
    type: "Reading",
    time: "60 min",
    done: false,
  },
  {
    day: "Tomorrow",
    title: "Explore available datasets",
    type: "Dataset",
    time: "45 min",
    done: false,
  },
  {
    day: "Wed",
    title: "Write problem statement",
    type: "Writing",
    time: "60 min",
    done: false,
  },
];

export default function PlannerPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-[#9b8cff]">
              <CalendarDays size={14} />
              Research planner
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Your research plan
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#777b86]">
              Organize research, learning, experiments and deadlines in one
              place.
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 rounded-lg bg-[#9b8cff] px-4 py-2.5 text-sm font-medium text-black">
            <Plus size={16} />
            Add task
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat title="This week" value="7.5h" subtitle="planned research" />
          <Stat title="Progress" value="32%" subtitle="project completion" />
          <Stat title="Deadline" value="24 days" subtitle="remaining" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-2xl border border-[#20232b] bg-[#0d0f14]">
            <div className="border-b border-[#20232b] px-5 py-4">
              <h2 className="text-sm font-medium">Upcoming work</h2>
            </div>

            <div className="divide-y divide-[#20232b]">
              {tasks.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <button className="shrink-0 text-[#696d78]">
                    <CheckCircle2
                      size={20}
                      className={task.done ? "text-[#9b8cff]" : ""}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{task.title}</div>

                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[#666a75]">
                      <span>{task.day}</span>
                      <span>·</span>
                      <span>{task.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#686c77]">
                    <Clock3 size={13} />
                    {task.time}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-2xl border border-[#292532] bg-[#0e0d14] p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles size={16} className="text-[#9b8cff]" />
              Research assistant
            </div>

            <p className="mt-3 text-xs leading-6 text-[#77717f]">
              Later, ScholarGraph will analyze your research goal and suggest
              a realistic learning and research schedule.
            </p>

            <button className="mt-5 w-full rounded-lg border border-[#332f40] px-3 py-2.5 text-xs text-[#b8b0ca] hover:bg-white/[0.03]">
              Generate research plan
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-[#20232b] bg-[#0d0f14] p-5">
      <div className="text-xs text-[#6e727d]">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-[11px] text-[#5f636d]">{subtitle}</div>
    </div>
  );
}