export type ResearchResource = {
  title: string;
  resource_type: string;
  description: string;
  url?: string | null;
};


export type LearningTopic = {
  topic: string;
  why_it_matters: string;
  estimated_hours: number;
  resources: ResearchResource[];
};


export type ResearchPaper = {
  title: string;
  authors: string[];
  year: number;
  description: string;
  url?: string | null;
};


export type ResearchMilestone = {
  title: string;
  description: string;
  estimated_hours: number;
};


export type ResearchRequest = {
  question: string;
  experience_level: string;
  hours_per_week: number;
  deadline?: string;
};


export type ResearchPlan = {
  question: string;
  understanding: string;

  topics: string[];

  prerequisites: string[];

  learning_path: LearningTopic[];

  foundational_papers: ResearchPaper[];

  recent_papers: ResearchPaper[];

  datasets: ResearchResource[];

  milestones: ResearchMilestone[];
};


const API_URL = "http://localhost:8001";


export async function generateResearchPlan(
  request: ResearchRequest
): Promise<ResearchPlan> {

  const response = await fetch(
    `${API_URL}/api/research/plan`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(request),
    }
  );


  if (!response.ok) {
    throw new Error(
      "Failed to generate research plan"
    );
  }


  return response.json();
}