from typing import TypedDict


class ResearchState(TypedDict, total=False):
    question: str
    experience_level: str
    hours_per_week: int
    deadline: str | None
    domain: str
    subtopics: list[str]
    prerequisites: list[str]
    learning_topics: list[dict]
    foundational_papers: list[dict]
    recent_papers: list[dict]
    datasets: list[dict]
    books: list[dict]
    understanding: str
    milestones: list[dict]
    daily_tasks: list[dict]
    research_scope: list[str]
    key_concepts: list[str]
    established_approaches: list[str]
    challenges: list[str]
    research_directions: list[str]
    research_gaps: list[str]
