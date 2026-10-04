const API_BASE =
  process.env.NEXT_PUBLIC_RESEARCH_API_URL ??
  "http://localhost:8000";

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
    }
  );

  if (!response.ok) {
    throw new Error(
      `Research API failed: ${response.status}`
    );
  }

  return response.json();
}


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

  console.log("BOOK API RESPONSE:", data);

  // Backend returns { results: [...] }
  if (Array.isArray(data?.results)) {
    return data.results;
  }

  // Safety in case backend returns the array directly
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

  console.log("DATASET API RESPONSE:", data);

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}