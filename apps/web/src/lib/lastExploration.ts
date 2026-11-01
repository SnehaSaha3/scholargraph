import type { ResearchExploration } from "@/lib/researchApi";

const LAST_EXPLORATION_KEY = "scholargraph:last-exploration";

export function readLastExploration(
  question: string
): ResearchExploration | null {
  try {
    const raw = window.localStorage.getItem(LAST_EXPLORATION_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ResearchExploration> | null;

    if (!parsed || typeof parsed.question !== "string") return null;

    if (parsed.question.trim() !== question.trim()) return null;

    return parsed as ResearchExploration;
  } catch {
    return null;
  }
}