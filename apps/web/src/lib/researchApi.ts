const API_BASE =
  process.env.NEXT_PUBLIC_RESEARCH_API_URL ??
  "http://localhost:8000";




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

async function authRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ?? `Authentication failed: ${response.status}`
    );
  }

  return data as T;
}

export function registerUser(input: {
  email: string;
  password: string;
  display_name: string;
}): Promise<AuthUser> {
  return authRequest<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  return authRequest<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return authRequest<AuthUser>("/api/auth/me");
}

export function logoutUser(): Promise<void> {
  return authRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

/* =========================================================
   RESEARCH
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

export async function exploreResearch(
  question: string
): Promise<ResearchExploration> {
  const response = await fetch(
    `${API_BASE}/api/research/explore`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        question,
      }),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail ??
        `Research exploration failed: ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   RESEARCH PLAN
========================================================= */

export type ResearchPlan = {
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

export async function generateResearchPlan(
  input: {
    question: string;
    experience_level?: string;
    hours_per_week?: number;
    deadline?: string;
  }
): Promise<ResearchPlan> {
  const response = await fetch(
    `${API_BASE}/api/research/plan`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        question: input.question,

        experience_level:
          input.experience_level ?? "beginner",

        hours_per_week:
          input.hours_per_week ?? 10,

        deadline:
          input.deadline ?? null,
      }),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail ??
        `Research plan failed: ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   RESEARCH DISCUSSION
========================================================= */

export type ResearchDiscussionMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ResearchDiscussionResponse = {
  answer: string;
  supporting_papers: ResearchPaper[];
  suggested_questions: string[];
};

export async function discussResearch(
  input: {
    question: string;
    research: ResearchExploration;
    messages: ResearchDiscussionMessage[];
    prompt: string;
  }
): Promise<ResearchDiscussionResponse> {
  const response = await fetch(
    `${API_BASE}/api/research/discuss`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify(input),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail ??
        `Research discussion failed: ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   RESOURCE SEARCH
========================================================= */

export async function searchBooks(
  query: string
): Promise<ResearchResource[]> {
  const response = await fetch(
    `${API_BASE}/api/resources/books?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Book search failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export async function searchDatasets(
  query: string
): Promise<ResearchResource[]> {
  const response = await fetch(
    `${API_BASE}/api/resources/datasets?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Dataset search failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

export async function searchPapers(
  query: string
): Promise<ResearchPaper[]> {
  const response = await fetch(
    `${API_BASE}/api/resources/papers?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Paper search failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
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

export async function inspectGitHubRepository(
  githubUrl: string
): Promise<ProjectRepositoryInspection> {
  const response = await fetch(
    `${API_BASE}/api/projects/repository`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        github_url: githubUrl,
      }),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail ??
        `GitHub inspection failed: ${response.status}`
    );
  }

  return response.json();
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

export async function analyzeProjectImplementation(
  githubUrl: string,
  question: string
): Promise<ProjectImplementationResponse> {
  const response = await fetch(
    `${API_BASE}/api/projects/implementation`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        github_url: githubUrl,
        question,
      }),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail ??
        `Implementation advisor failed: ${response.status}`
    );
  }

  return response.json();
}

/* =========================================================
   LEGACY REVIEW TYPE
   Kept so existing frontend files do not break.
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

export async function reviewGitHubRepository(
  githubUrl: string,
  question: string
): Promise<ProjectReview> {
  const response = await fetch(
    `${API_BASE}/api/projects/review`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        github_url: githubUrl,
        question,
      }),

      cache: "no-store",
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.detail ??
        `GitHub review failed: ${response.status}`
    );
  }

  return response.json();
}