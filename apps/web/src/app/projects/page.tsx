
"use client";

import {
  Suspense,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  GitBranch,
  Lightbulb,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  Wrench,
  FolderGit2,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

import {
  analyzeProjectImplementation,
  createSavedProject,
  deleteSavedProject,
  listSavedProjects,
  ProjectImplementationResponse,
  SavedProject,
} from "@/lib/researchApi";

function PapersContent() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const [showConnect, setShowConnect] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  const result: ProjectImplementationResponse | null =
    selectedProject?.result ?? null;

  const updateProjectUrl = useCallback((projectId: string | null) => {
    const url = new URL(window.location.href);

    if (projectId) {
      url.searchParams.set("id", projectId);
    } else {
      url.searchParams.delete("id");
    }

    window.history.pushState({}, "", url);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setPageError("");

    try {
      const savedProjects = await listSavedProjects();
      setProjects(savedProjects);

      const requestedId = new URLSearchParams(
        window.location.search
      ).get("id");

      if (
        requestedId &&
        savedProjects.some((project) => project.id === requestedId)
      ) {
        setSelectedProjectId(requestedId);
      } else {
        setSelectedProjectId(null);

        if (requestedId) {
          const url = new URL(window.location.href);
          url.searchParams.delete("id");
          window.history.replaceState({}, "", url);
        }
      }
    } catch (err) {
      console.error("Unable to load saved projects:", err);
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to load your saved projects. Please try again."
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();

    function handlePopState() {
      const id = new URLSearchParams(window.location.search).get("id");

      if (id && projectsRef.current.some((project) => project.id === id)) {
        setSelectedProjectId(id);
        setShowConnect(false);
      } else if (!id) {
        setSelectedProjectId(null);
        setShowConnect(false);
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // Load once when the page mounts. URL selection is handled separately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProjects]);

  // Keep browser Back/Forward selection in sync with the latest saved list.
  const projectsRef = useLatestProjects(projects);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const repository = githubUrl.trim();
    const researchQuestion = question.trim();

    if (!repository) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    if (!researchQuestion) {
      setError("Please describe what you are trying to build.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate recommendations only when connecting a project.
      const response = await analyzeProjectImplementation(
        repository,
        researchQuestion
      );

      // Persist the full advisor response before showing the project.
      const savedProject = await createSavedProject({
        github_url: repository,
        research_question: researchQuestion,
        result: response,
      });

      setProjects((current) => [
        savedProject,
        ...current.filter((project) => project.id !== savedProject.id),
      ]);

      setSelectedProjectId(savedProject.id);
      updateProjectUrl(savedProject.id);

      setShowConnect(false);
      setGithubUrl("");
      setQuestion("");
    } catch (err) {
      console.error("ScholarGraph project error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate or save implementation guidance."
      );
    } finally {
      setLoading(false);
    }
  }

  function openConnect() {
    setError("");
    setGithubUrl("");
    setQuestion("");
    setShowConnect(true);
  }

  function closeConnect() {
    setError("");
    setShowConnect(false);
  }

  function openProject(project: SavedProject) {
    setSelectedProjectId(project.id);
    setShowConnect(false);
    setError("");
    updateProjectUrl(project.id);
  }

  function backToProjects() {
    setSelectedProjectId(null);
    setShowConnect(false);
    setError("");
    updateProjectUrl(null);
  }

  async function handleDeleteProject(project: SavedProject) {
    const confirmed = window.confirm(
      `Delete "${project.repository_name}" and its saved recommendations?`
    );

    if (!confirmed) return;

    setDeletingProjectId(project.id);
    setPageError("");

    try {
      await deleteSavedProject(project.id);

      setProjects((current) =>
        current.filter((item) => item.id !== project.id)
      );

      if (selectedProjectId === project.id) {
        setSelectedProjectId(null);
        updateProjectUrl(null);
      }
    } catch (err) {
      console.error("Unable to delete project:", err);
      setPageError(
        err instanceof Error
          ? err.message
          : "Unable to delete this project."
      );
    } finally {
      setDeletingProjectId(null);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
              Projects
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                <Wrench size={17} strokeWidth={1.7} />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                Research Projects
              </h1>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
              Keep your research repositories and implementation
              recommendations together.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={loadingProjects}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-xs text-[#777b86] transition hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={loadingProjects ? "animate-spin" : ""}
              />
              Refresh list
            </button>

            <button
              type="button"
              onClick={openConnect}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#9b8cff]/25 bg-[#9b8cff]/10 px-4 text-xs font-medium text-[#c5beff] transition hover:bg-[#9b8cff]/15"
            >
              <Plus size={14} strokeWidth={1.8} />
              Connect project
            </button>
          </div>
        </div>

        {pageError && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-xs text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <span>{pageError}</span>
            <button
              type="button"
              onClick={() => void loadProjects()}
              className="shrink-0 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* =====================================================
            LOADING SAVED PROJECTS
        ====================================================== */}

        {loadingProjects && (
          <section className="mt-8 flex items-center justify-center rounded-2xl border border-[#272a33] bg-[#0d0f14] px-6 py-16">
            <div className="flex items-center gap-3 text-sm text-[#777b86]">
              <Loader2 size={17} className="animate-spin text-[#9b8cff]" />
              Loading your saved projects...
            </div>
          </section>
        )}

        {/* =====================================================
            PROJECT LIST
        ====================================================== */}

        {!loadingProjects &&
          !selectedProject &&
          !showConnect &&
          projects.length > 0 && (
            <section className="mt-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium text-white">
                    Your projects
                  </h2>
                  <p className="mt-1 text-xs text-[#686c77]">
                    Your saved recommendations remain available when you
                    return.
                  </p>
                </div>

                <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-[#777b86]">
                  {projects.length} saved
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="group flex min-w-0 flex-col rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 transition hover:border-[#9b8cff]/30"
                  >
                    <button
                      type="button"
                      onClick={() => openProject(project)}
                      className="flex flex-1 flex-col text-left"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9b8cff]/10 text-[#9b8cff]">
                          <FolderGit2 size={18} strokeWidth={1.6} />
                        </div>

                        <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-emerald-300">
                          Saved
                        </span>
                      </div>

                      <h3 className="mt-5 break-words text-base font-medium text-white transition group-hover:text-[#c5beff]">
                        {project.repository_name}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#777b86]">
                        {project.result.advisor.summary}
                      </p>

                      <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                        <p className="text-[9px] uppercase tracking-[0.12em] text-[#555963]">
                          Recommended next
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#c4c6cc]">
                          {project.result.advisor.next_implementation.title}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#555963]">
                        <span>
                          {project.result.advisor.roadmap.length} roadmap stages
                        </span>
                        <span>·</span>
                        <span>
                          Updated{" "}
                          {formatDate(project.updated_at)}
                        </span>
                      </div>
                    </button>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                      <button
                        type="button"
                        onClick={() => openProject(project)}
                        className="inline-flex items-center gap-2 text-xs text-[#c5beff] transition hover:text-white"
                      >
                        View recommendations
                        <ArrowRight size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteProject(project)}
                        disabled={deletingProjectId === project.id}
                        aria-label={`Delete ${project.repository_name}`}
                        title="Delete project"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#555963] transition hover:bg-red-400/[0.06] hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingProjectId === project.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}

        {!loadingProjects &&
          !selectedProject &&
          !showConnect &&
          projects.length === 0 && (
            <section className="mt-8 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-6 sm:p-8 lg:p-10">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9b8cff]/10 text-[#9b8cff]">
                  <Rocket size={25} strokeWidth={1.5} />
                </div>

                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.025em] text-white">
                  What should you build next?
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#777b86]">
                  Connect your research repository to discover the next
                  meaningful implementation, suitable tools, prerequisites,
                  and recommended build order. Your saved projects will
                  appear here.
                </p>

                <button
                  type="button"
                  onClick={openConnect}
                  className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#9b8cff] px-5 text-xs font-medium text-[#100f17] transition hover:bg-[#a99cff]"
                >
                  <GitBranch size={15} strokeWidth={1.8} />
                  Connect GitHub project
                </button>
              </div>

              <div className="mx-auto mt-10 grid max-w-4xl gap-3 border-t border-white/[0.06] pt-8 sm:grid-cols-3">
                <ProjectFeature
                  icon={GitBranch}
                  title="Understand"
                  description="See what is already implemented in your project."
                />
                <ProjectFeature
                  icon={Lightbulb}
                  title="Recommend"
                  description="Identify the next research implementation worth building."
                />
                <ProjectFeature
                  icon={Wrench}
                  title="Implement"
                  description="Get tools, prerequisites, steps, and alternatives."
                />
              </div>
            </section>
          )}

        {/* =====================================================
            CONNECT PROJECT
        ====================================================== */}

        {!loadingProjects && showConnect && (
          <>
            <div className="mt-8">
              <button
                type="button"
                onClick={closeConnect}
                className="mb-5 text-xs text-[#686c77] transition hover:text-white"
              >
                ← Back to projects
              </button>

              <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
                Projects
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                  <GitBranch size={17} strokeWidth={1.7} />
                </div>

                <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                  Connect a Project
                </h2>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777b86]">
                Give ScholarGraph the research goal and repository behind
                your project. Existing projects will stay saved.
              </p>
            </div>

            <section className="mt-8 rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="github-url"
                    className="text-xs font-medium text-[#c4c6cc]"
                  >
                    GitHub repository
                  </label>

                  <div className="relative mt-2">
                    <GitBranch
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555963]"
                      strokeWidth={1.7}
                    />

                    <input
                      id="github-url"
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(event) => setGithubUrl(event.target.value)}
                      placeholder="https://github.com/username/project"
                      className="h-11 w-full rounded-lg border border-white/[0.08] bg-white/[0.025] pl-11 pr-4 text-sm text-[#d4d5da] outline-none transition placeholder:text-[#555963] focus:border-[#9b8cff]/40"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="research-question"
                    className="text-xs font-medium text-[#c4c6cc]"
                  >
                    What are you trying to build?
                  </label>

                  <textarea
                    id="research-question"
                    required
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={5}
                    placeholder="Example: Build a region-specific medicinal crop recommendation system for Assam."
                    className="mt-2 w-full resize-y rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 text-sm leading-6 text-[#d4d5da] outline-none transition placeholder:text-[#555963] focus:border-[#9b8cff]/40"
                  />

                  <p className="mt-2 text-[10px] leading-5 text-[#555963]">
                    This gives the implementation advisor the research
                    context it needs.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-xs text-red-300"
                  >
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-md text-[10px] leading-5 text-[#555963]">
                    GitHub is used as implementation context. ScholarGraph
                    will save the generated recommendations to your account.
                  </p>

                  <button
                    type="submit"
                    disabled={
                      loading || !githubUrl.trim() || !question.trim()
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#9b8cff]/25 bg-[#9b8cff]/10 px-5 text-xs font-medium text-[#c5beff] transition hover:bg-[#9b8cff]/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating and saving...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} strokeWidth={1.8} />
                        Generate guidance
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}

        {/* =====================================================
            SELECTED PROJECT DETAILS
        ====================================================== */}

        {selectedProject && result && (
          <>
            <div className="mt-8 mb-6">
              <button
                type="button"
                onClick={backToProjects}
                className="mb-5 text-xs text-[#686c77] transition hover:text-white"
              >
                ← All projects
              </button>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#686c77]">
                  Saved project
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9b8cff]/10 text-[#9b8cff]">
                    <GitBranch size={17} strokeWidth={1.7} />
                  </div>

                  <h2 className="break-words text-3xl font-semibold tracking-[-0.03em] text-white">
                    {result.repository.name}
                  </h2>
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#777b86]">
                  {result.advisor.summary}
                </p>

                <p className="mt-2 text-[10px] text-[#555963]">
                  Saved {formatDate(selectedProject.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={result.repository.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-xs text-[#777b86] transition hover:border-white/[0.14] hover:text-white"
                >
                  <GitBranch size={14} strokeWidth={1.7} />
                  GitHub
                  <ExternalLink size={11} strokeWidth={1.7} />
                </a>

                <button
                  type="button"
                  onClick={openConnect}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#9b8cff]/25 bg-[#9b8cff]/10 px-4 text-xs font-medium text-[#c5beff] transition hover:bg-[#9b8cff]/15"
                >
                  <Plus size={14} strokeWidth={1.8} />
                  New project
                </button>
              </div>
            </div>

            {/* Current / Next */}
            <section className="mt-8 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#272a33] bg-[#0d0f14] p-5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                  <Circle
                    size={8}
                    className="fill-emerald-400 text-emerald-400"
                  />
                  Current implementation
                </div>

                <h3 className="mt-4 text-lg font-medium leading-7 text-[#d4d5da]">
                  {result.advisor.current_stage}
                </h3>

                <p className="mt-3 text-xs leading-5 text-[#686c77]">
                  This is the implementation stage identified from your
                  connected repository when the recommendations were generated.
                </p>
              </div>

              <div className="rounded-2xl border border-[#9b8cff]/20 bg-[#9b8cff]/[0.045] p-5">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#a99eff]">
                  <Lightbulb size={13} strokeWidth={1.7} />
                  Recommended next
                </div>

                <h3 className="mt-4 text-xl font-semibold leading-7 text-white">
                  {result.advisor.next_implementation.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#777b86]">
                  {result.advisor.next_implementation.why_now}
                </p>
              </div>
            </section>

            {/* Roadmap */}
            <section className="mt-8">
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                  Build sequence
                </p>

                <div className="mt-1 flex items-center justify-between gap-4">
                  <h3 className="text-sm font-medium text-white">
                    Research implementation roadmap
                  </h3>

                  <span className="text-[10px] text-[#555963]">
                    {result.advisor.roadmap.length} stage
                    {result.advisor.roadmap.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {result.advisor.roadmap.map((item, index) => (
                  <RoadmapCard
                    key={`${item.title}-${index}`}
                    index={index}
                    title={item.title}
                    status={item.status}
                    technology={item.technology}
                    recommendation={item.recommendation}
                    why={item.why}
                    isLast={index === result.advisor.roadmap.length - 1}
                  />
                ))}
              </div>
            </section>

            {/* Immediate implementation */}
            <section className="mt-8">
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                  Immediate implementation
                </p>

                <h3 className="mt-1 text-sm font-medium text-white">
                  Build this next
                </h3>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#272a33] bg-[#0d0f14]">
                <div className="grid lg:grid-cols-2">
                  <div className="border-b border-white/[0.06] p-5 lg:border-b-0 lg:border-r">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                      Recommended tools
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.advisor.next_implementation.recommended_tools.map(
                        (tool) => (
                          <span
                            key={tool}
                            className="rounded-md border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 text-[10px] text-[#777b86]"
                          >
                            {tool}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                      Alternatives
                    </p>

                    <div className="mt-4 space-y-2">
                      {result.advisor.next_implementation.alternatives.map(
                        (alternative) => (
                          <div
                            key={alternative}
                            className="flex gap-2 text-xs leading-5 text-[#777b86]"
                          >
                            <ArrowRight
                              size={13}
                              className="mt-1 shrink-0 text-[#555963]"
                            />
                            {alternative}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                    Prerequisites
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {result.advisor.next_implementation.prerequisites.map(
                      (item) => (
                        <div
                          key={item}
                          className="flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.015] p-3"
                        >
                          <CheckCircle2
                            size={15}
                            className="mt-0.5 shrink-0 text-[#555963]"
                          />
                          <span className="text-xs leading-5 text-[#777b86]">
                            {item}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="border-t border-white/[0.06] p-5">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#686c77]">
                    Implementation steps
                  </p>

                  <div className="mt-5 space-y-4">
                    {result.advisor.next_implementation.implementation_steps.map(
                      (step, index) => (
                        <div key={`${step}-${index}`} className="flex gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.025] text-[10px] text-[#686c77]">
                            {index + 1}
                          </div>

                          <p className="pt-0.5 text-xs leading-5 text-[#777b86]">
                            {step}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="border-t border-[#9b8cff]/10 bg-[#9b8cff]/[0.025] p-5">
                  <div className="flex gap-3">
                    <ArrowRight
                      size={15}
                      className="mt-0.5 shrink-0 text-[#9b8cff]"
                    />

                    <div>
                      <p className="text-xs font-medium text-[#c4c6cc]">
                        What comes after
                      </p>

                      <p className="mt-1.5 text-xs leading-5 text-[#686c77]">
                        {result.advisor.next_implementation.what_comes_after}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="flex gap-3">
                <Sparkles
                  size={15}
                  className="mt-0.5 shrink-0 text-[#9b8cff]"
                />

                <p className="text-[10px] leading-5 text-[#686c77]">
                  These are the saved recommendations from when this project
                  was connected. Connect it again if you want to generate a
                  fresh analysis of the repository.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

/* =========================================================
   KEEP LATEST PROJECTS AVAILABLE TO BROWSER HISTORY HANDLER
========================================================= */

function useLatestProjects(projects: SavedProject[]) {
  const [latest, setLatest] = useState(projects);

  useEffect(() => {
    setLatest(projects);
  }, [projects]);

  return { current: latest };
}

/* =========================================================
   DATE FORMAT
========================================================= */

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

/* =========================================================
   PROJECT FEATURE
========================================================= */

function ProjectFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GitBranch;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
      <Icon
        size={17}
        strokeWidth={1.6}
        className="text-[#686c77]"
      />

      <p className="mt-4 text-xs font-medium text-[#c4c6cc]">
        {title}
      </p>

      <p className="mt-1.5 text-[10px] leading-5 text-[#686c77]">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   ROADMAP CARD
========================================================= */

function RoadmapCard({
  index,
  title,
  status,
  technology,
  recommendation,
  why,
  isLast,
}: {
  index: number;
  title: string;
  status: string;
  technology: string;
  recommendation?: string | null;
  why: string;
  isLast: boolean;
}) {
  const isNext =
    status.toLowerCase().includes("next") ||
    status.toLowerCase().includes("progress");

  const isImplemented =
    status.toLowerCase().includes("implement") ||
    status.toLowerCase().includes("complete") ||
    status.toLowerCase().includes("done");

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-[18px] top-10 h-[calc(100%+12px)] w-px bg-white/[0.06]" />
      )}

      <article
        className={[
          "relative rounded-2xl border p-5 transition",
          isNext
            ? "border-[#9b8cff]/25 bg-[#9b8cff]/[0.045]"
            : "border-[#272a33] bg-[#0d0f14]",
        ].join(" ")}
      >
        <div className="flex gap-4">
          <div
            className={[
              "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[11px] font-medium",
              isNext
                ? "border-[#9b8cff]/25 bg-[#9b8cff]/10 text-[#c5beff]"
                : "border-white/[0.07] bg-[#101218] text-[#686c77]",
            ].join(" ")}
          >
            {index + 1}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-[#d4d5da]">
                {title}
              </h3>

              {isImplemented && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/[0.06] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-emerald-300">
                  <Check size={10} />
                  Implemented
                </span>
              )}

              {isNext && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#9b8cff]/10 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-[#c5beff]">
                  <ArrowRight size={10} />
                  Next
                </span>
              )}
            </div>

            <div className="mt-2">
              <span className="text-[10px] text-[#555963]">
                {technology}
              </span>
            </div>

            <p className="mt-3 max-w-4xl text-xs leading-5 text-[#777b86]">
              {why}
            </p>

            {recommendation && (
              <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-[0.12em] text-[#555963]">
                  Suggested approach
                </p>

                <p className="mt-1 text-[11px] leading-5 text-[#777b86]">
                  {recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
export default function PapersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08090c] text-sm text-[#777b86]">
          Loading papers...
        </div>
      }
    >
      <PapersContent />
    </Suspense>
  );
}
