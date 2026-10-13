

const API_BASE = (
  process.env.NEXT_PUBLIC_RESEARCH_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    console.error("[researchApi] Network request failed", {
      url: `${API_BASE}${path}`,
      error,
    });

    throw new Error(
      `Cannot reach the research API at ${API_BASE}. Check the backend URL, server status, and CORS configuration.`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ??
        data?.message ??
        `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return data as T;
}

/* =========================================================
   AUTHENTICATION
========================================================= */

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  email_verified: boolean;
};

export function registerUser(input: {
  email: string;
  password: string;
  display_name: string;
}): Promise<AuthUser> {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function googleLogin(credential: string): Promise<AuthUser> {
  return apiRequest("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest("/api/auth/me");
}

export function logoutUser(): Promise<void> {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

/* =========================================================
   PERSISTENT RESEARCH HISTORY
========================================================= */

export type ResearchConversationSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

export type ResearchStoredMessage = {
  id: string;
  role: "user" | "assistant";
  kind: "explore" | "discuss" | "plan" | string;
  content: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type ResearchConversationDetail = ResearchConversationSummary & {
  messages: ResearchStoredMessage[];
};

export async function listResearchHistory(
  search?: string
): Promise<ResearchConversationSummary[]> {
  const query = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  return apiRequest(`/api/research/history${query}`);
}

export function getResearchConversation(
  conversationId: string
): Promise<ResearchConversationDetail> {
  return apiRequest(
    `/api/research/history/${encodeURIComponent(conversationId)}`
  );
}

export function renameResearchConversation(
  conversationId: string,
  title: string
): Promise<ResearchConversationSummary> {
  return apiRequest(
    `/api/research/history/${encodeURIComponent(conversationId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }
  );
}

export function deleteResearchConversation(
  conversationId: string
): Promise<void> {
  return apiRequest(
    `/api/research/history/${encodeURIComponent(conversationId)}`,
    { method: "DELETE" }
  );
}

/* =========================================================
   RESEARCH TYPES
========================================================= */

export type ResearchResource = {
  title: string;
  resource_type: string;
  description: string;
  authors?: string[];
  year?: number;
  url?: string | null;
  cover_url?: string | null;
  subjects?: string[];
  access_type?: string | null;
  action_label?: string | null;
  read_url?: string | null;
  borrow_url?: string | null;
  source?: string | null;
  relevance_score?: number | null;
};

export type ResearchPaper = {
  title: string;
  authors: string[];
  year: number;
  description: string;
  url?: string | null;
};

export type LearningTopic = {
  topic: string;
  why_it_matters: string;
  estimated_hours: number;
  resources: ResearchResource[];
};

export type ResearchMilestone = {
  title: string;
  description: string;
  estimated_hours: number;
};

export type ResearchDailyTask = {
  day: number;
  title: string;
  description: string;
  estimated_minutes: number;
  milestone: string;
  resource_title?: string | null;
  resource_url?: string | null;
};

/* =========================================================
   RESEARCH EXPLORATION
========================================================= */

export type ResearchExploration = {
  conversation_id?: string | null;
  question: string;
  understanding: string;
  research_scope: string[];
  key_concepts: string[];
  established_approaches: string[];
  challenges: string[];
  research_directions: string[];
  research_gaps: string[];
  topics: string[];
  prerequisites: string[];
  foundational_papers: ResearchPaper[];
  recent_papers: ResearchPaper[];
  datasets: ResearchResource[];
  books: ResearchResource[];
};

export function exploreResearch(
  question: string,
  conversationId?: string | null
): Promise<ResearchExploration> {
  return apiRequest("/api/research/explore", {
    method: "POST",
    body: JSON.stringify({
      question,
      conversation_id: conversationId ?? null,
    }),
  });
}

/* =========================================================
   RESEARCH PLAN
========================================================= */

export type ResearchPlan = {
  conversation_id?: string | null;
  question: string;
  understanding: string;
  research_scope: string[];
  key_concepts: string[];
  established_approaches: string[];
  challenges: string[];
  research_directions: string[];
  research_gaps: string[];
  topics: string[];
  prerequisites: string[];
  learning_path: LearningTopic[];
  foundational_papers: ResearchPaper[];
  recent_papers: ResearchPaper[];
  datasets: ResearchResource[];
  books: ResearchResource[];
  milestones: ResearchMilestone[];
  daily_tasks: ResearchDailyTask[];
};

export function generateResearchPlan(input: {
  question: string;
  experience_level?: string;
  hours_per_week?: number;
  deadline?: string;
  conversation_id?: string | null;
}): Promise<ResearchPlan> {
  return apiRequest("/api/research/plan", {
    method: "POST",
    body: JSON.stringify({
      question: input.question,
      experience_level: input.experience_level ?? "beginner",
      hours_per_week: input.hours_per_week ?? 10,
      deadline: input.deadline ?? null,
      conversation_id: input.conversation_id ?? null,
    }),
  });
}

/* =========================================================
   RESEARCH DISCUSSION
========================================================= */

export type ResearchDiscussionMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ResearchDiscussionResponse = {
  conversation_id?: string | null;
  answer: string;
  supporting_papers: ResearchPaper[];
  suggested_questions: string[];
};

export function discussResearch(input: {
  question: string;
  research: ResearchExploration;
  messages: ResearchDiscussionMessage[];
  prompt: string;
  conversation_id?: string | null;
}): Promise<ResearchDiscussionResponse> {
  return apiRequest("/api/research/discuss", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      conversation_id:
        input.conversation_id ??
        input.research.conversation_id ??
        null,
    }),
  });
}

/* =========================================================
   RESOURCE SEARCH
========================================================= */

async function resourceSearch<T>(
  path: string
): Promise<T[]> {
  const data = await apiRequest<unknown>(path);

  if (Array.isArray(data)) return data as T[];

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  ) {
    return (data as { results: T[] }).results;
  }

  return [];
}

export function searchBooks(query: string): Promise<ResearchResource[]> {
  return resourceSearch(
    `/api/resources/books?query=${encodeURIComponent(query)}`
  );
}

export function searchDatasets(query: string): Promise<ResearchResource[]> {
  return resourceSearch(
    `/api/resources/datasets?query=${encodeURIComponent(query)}`
  );
}

export function searchPapers(query: string): Promise<ResearchPaper[]> {
  return resourceSearch(
    `/api/resources/papers?query=${encodeURIComponent(query)}`
  );
}

/* =========================================================
   PROJECTS
========================================================= */

export type ProjectRepository = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string | null;
  private: boolean;
};

export type ProjectRepositorySignals = {
  has_readme: boolean;
  has_tests: boolean;
  has_requirements: boolean;
  has_package_json: boolean;
  has_docker: boolean;
  has_ci: boolean;
  has_config: boolean;
  possible_env_files: string[];
};

export type ProjectRepositoryInspection = {
  repository: ProjectRepository;
  signals: ProjectRepositorySignals;
  tree_summary: {
    total_files: number;
    relevant_files: string[];
  };
};

export function inspectGitHubRepository(
  githubUrl: string
): Promise<ProjectRepositoryInspection> {
  return apiRequest("/api/projects/repository", {
    method: "POST",
    body: JSON.stringify({ github_url: githubUrl }),
  });
}

/* =========================================================
   IMPLEMENTATION ADVISOR
========================================================= */

export type ImplementationRoadmapItem = {
  title: string;
  status: string;
  technology: string;
  recommendation?: string | null;
  why: string;
};

export type ImplementationNextStep = {
  title: string;
  why_now: string;
  recommended_tools: string[];
  alternatives: string[];
  prerequisites: string[];
  implementation_steps: string[];
  what_comes_after: string;
};

export type ProjectImplementationAdvisor = {
  summary: string;
  current_stage: string;
  roadmap: ImplementationRoadmapItem[];
  next_implementation: ImplementationNextStep;
};

export type ProjectImplementationResponse = {
  repository: ProjectRepository;
  advisor: ProjectImplementationAdvisor;
};

export function analyzeProjectImplementation(
  githubUrl: string,
  question: string
): Promise<ProjectImplementationResponse> {
  return apiRequest("/api/projects/implementation", {
    method: "POST",
    body: JSON.stringify({ github_url: githubUrl, question }),
  });
}

/* =========================================================
   LEGACY REVIEW TYPE
========================================================= */

export type ProjectReviewFinding = {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  explanation: string;
  file?: string | null;
  suggested_fix: string;
};

export type ProjectReview = {
  repository: ProjectRepository;
  relevant_files: string[];
  review: {
    summary: string;
    implementation_strengths: string[];
    research_findings: ProjectReviewFinding[];
    code_findings: ProjectReviewFinding[];
    reproducibility_findings: ProjectReviewFinding[];
    next_steps: string[];
  };
};

export function reviewGitHubRepository(
  githubUrl: string,
  question: string
): Promise<ProjectReview> {
  return apiRequest("/api/projects/review", {
    method: "POST",
    body: JSON.stringify({ github_url: githubUrl, question }),
  });
}


/* =========================================================
   PERSISTENT PLANNER PROGRESS
========================================================= */

export type ResearchPlannerProgress = {
  conversation_id: string;
  completed_task_ids: string[];
  updated_at?: string | null;
};

export function getResearchPlannerProgress(
  conversationId: string
): Promise<ResearchPlannerProgress> {
  return apiRequest(
    `/api/research/history/${encodeURIComponent(
      conversationId
    )}/planner-progress`
  );
}

export function saveResearchPlannerProgress(
  conversationId: string,
  completedTaskIds: string[]
): Promise<ResearchPlannerProgress> {
  return apiRequest(
    `/api/research/history/${encodeURIComponent(
      conversationId
    )}/planner-progress`,
    {
      method: "PUT",
      body: JSON.stringify({
        completed_task_ids: completedTaskIds,
      }),
    }
  );
}

export type SavedProject = {
  id: string;
  github_url: string;
  repository_name: string;
  research_question: string;
  result: ProjectImplementationResponse;
  created_at: string;
  updated_at: string;
};

export function listSavedProjects(): Promise<SavedProject[]> {
  return apiRequest("/api/saved-projects");
}

export function getSavedProject(
  projectId: string
): Promise<SavedProject> {
  return apiRequest(
    `/api/saved-projects/${encodeURIComponent(projectId)}`
  );
}

export function createSavedProject(input: {
  github_url: string;
  research_question: string;
  result: ProjectImplementationResponse;
}): Promise<SavedProject> {
  return apiRequest("/api/saved-projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteSavedProject(
  projectId: string
): Promise<void> {
  return apiRequest(
    `/api/saved-projects/${encodeURIComponent(projectId)}`,
    { method: "DELETE" }
  );
}