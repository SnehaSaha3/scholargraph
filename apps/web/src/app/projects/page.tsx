"use client";

import {
  FolderKanban,
  GitBranch,
  Plus,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  inspectGitHubRepository,
  type ProjectRepositoryInspection,
} from "@/lib/researchApi";


type Project = {
  id: string;
  name: string;
  question: string;
  description: string;
  githubUrl: string;
  repository?: ProjectRepositoryInspection;
  createdAt: string;
};


const STORAGE_KEY =
  "scholargraph:projects";


export default function ProjectsPage() {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);


  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY);

      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (error) {
      console.error(
        "Failed to load projects:",
        error
      );
    }
  }, []);


  function saveProjects(
    nextProjects: Project[]
  ) {
    setProjects(nextProjects);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextProjects)
    );
  }


  function createProject(
    project: Project
  ) {
    saveProjects([
      project,
      ...projects,
    ]);

    setShowCreate(false);
    setSelectedProject(project);
  }


  function updateProject(
    updated: Project
  ) {
    const next = projects.map(
      (project) =>
        project.id === updated.id
          ? updated
          : project
    );

    saveProjects(next);
    setSelectedProject(updated);
  }


  if (selectedProject) {
    return (
      <ProjectWorkspace
        project={selectedProject}
        onBack={() =>
          setSelectedProject(null)
        }
        onUpdate={updateProject}
      />
    );
  }


  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            Projects
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Your research projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Turn a research question into an
            implementation workspace and review
            the project for research quality,
            reproducibility, and code health.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreate(true)
          }
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </header>


      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FolderKanban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

          <h2 className="text-lg font-medium">
            No research projects yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Create your first project by connecting
            a research question to a GitHub repository.
          </p>

          <button
            type="button"
            onClick={() =>
              setShowCreate(true)
            }
            className="mt-6 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() =>
                setSelectedProject(project)
              }
            />
          ))}
        </div>
      )}


      {showCreate && (
        <CreateProjectModal
          onClose={() =>
            setShowCreate(false)
          }
          onCreate={createProject}
        />
      )}
    </main>
  );
}


function ProjectCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group rounded-xl border p-5 text-left transition hover:border-foreground/30"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">
            {project.name}
          </h2>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {project.question}
          </p>
        </div>

        <GitBranch className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>

      {project.repository ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {project.repository.repository.full_name}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          GitHub not inspected yet
        </div>
      )}
    </button>
  );
}


function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [description, setDescription] =
    useState("");
  const [githubUrl, setGithubUrl] =
    useState("");


  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !name.trim() ||
      !question.trim() ||
      !githubUrl.trim()
    ) {
      return;
    }

    onCreate({
      id: crypto.randomUUID(),
      name: name.trim(),
      question: question.trim(),
      description: description.trim(),
      githubUrl: githubUrl.trim(),
      createdAt: new Date().toISOString(),
    });
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Create research project
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Connect your research question to
              the implementation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        <div className="space-y-4">
          <Field
            label="Project name"
            value={name}
            onChange={setName}
            placeholder="Concealed Object Detection"
          />

          <Field
            label="Research question"
            value={question}
            onChange={setQuestion}
            placeholder="What are you trying to investigate?"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Briefly describe the project..."
            />
          </div>

          <Field
            label="GitHub repository"
            value={githubUrl}
            onChange={setGithubUrl}
            placeholder="https://github.com/owner/repository"
          />
        </div>


        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              !name.trim() ||
              !question.trim() ||
              !githubUrl.trim()
            }
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}


function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}


function ProjectWorkspace({
  project,
  onBack,
  onUpdate,
}: {
  project: Project;
  onBack: () => void;
  onUpdate: (project: Project) => void;
}) {
  const [inspection, setInspection] =
    useState<ProjectRepositoryInspection | null>(
      project.repository ?? null
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function runRepositoryInspection() {
    setLoading(true);
    setError("");

    try {
      const result =
        await inspectGitHubRepository(
          project.githubUrl
        );

      setInspection(result);

      onUpdate({
        ...project,
        repository: result,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Repository inspection failed."
      );
    } finally {
      setLoading(false);
    }
  }


  const signals =
    inspection?.signals;


  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Projects
      </button>


      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <FolderKanban className="h-4 w-4" />
          Project Workspace
        </div>

        <h1 className="text-3xl font-semibold">
          {project.name}
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          {project.question}
        </p>
      </header>


      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="rounded-xl border p-5">
            <h2 className="mb-3 font-medium">
              Research question
            </h2>

            <p className="text-sm leading-6">
              {project.question}
            </p>

            {project.description && (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>


          <div className="rounded-xl border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">
                  Repository
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {project.githubUrl}
                </p>
              </div>

              <GitBranch className="h-5 w-5 text-muted-foreground" />
            </div>


            {inspection && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Signal
                  label="README"
                  ok={inspection.signals.has_readme}
                />

                <Signal
                  label="Tests"
                  ok={inspection.signals.has_tests}
                />

                <Signal
                  label="Dependencies"
                  ok={
                    inspection.signals.has_requirements ||
                    inspection.signals.has_package_json
                  }
                />

                <Signal
                  label="CI"
                  ok={inspection.signals.has_ci}
                />

                <Signal
                  label="Configuration"
                  ok={inspection.signals.has_config}
                />

                <Signal
                  label="Docker"
                  ok={inspection.signals.has_docker}
                />
              </div>
            )}


            {inspection?.signals.possible_env_files.length ? (
              <div className="mt-4 flex gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                <div>
                  <p className="font-medium">
                    Possible environment file detected
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Check that secrets are not committed
                    to the repository.
                  </p>
                </div>
              </div>
            ) : null}


            {error && (
              <p className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}


            <button
              type="button"
              onClick={runRepositoryInspection}
              disabled={loading}
              className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <Search className="h-4 w-4" />

              {loading
                ? "Inspecting..."
                : "Inspect Repository"}
            </button>
          </div>


          {inspection && (
            <div className="rounded-xl border p-5">
              <h2 className="font-medium">
                Relevant project files
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                ScholarGraph selected these files for
                the next research/code review stage.
              </p>

              <div className="mt-4 space-y-2">
                {inspection.tree_summary.relevant_files.map(
                  (file) => (
                    <div
                      key={file}
                      className="rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs"
                    >
                      {file}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </section>


        <aside className="space-y-4">
          <div className="rounded-xl border p-5">
            <h2 className="font-medium">
              Project health
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Review will appear here after the
              research-aware analysis stage.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <StatusRow
                label="Repository connected"
                ok={Boolean(inspection)}
              />

              <StatusRow
                label="Static inspection"
                ok={Boolean(inspection)}
              />

              <StatusRow
                label="Research review"
                ok={false}
              />

              <StatusRow
                label="Reproducibility"
                ok={false}
              />
            </div>
          </div>


          {inspection && (
            <a
              href={inspection.repository.html_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Open on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </aside>
      </div>
    </main>
  );
}


function Signal({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
      {ok ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
      )}

      {label}
    </div>
  );
}


function StatusRow({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>

      {ok ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <span className="text-xs text-muted-foreground">
          Pending
        </span>
      )}
    </div>
  );
}