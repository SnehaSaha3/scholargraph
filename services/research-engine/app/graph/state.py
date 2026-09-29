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