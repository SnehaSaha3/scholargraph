from pydantic import BaseModel, Field


class ResearchRequest(BaseModel):

    question: str = Field(
        min_length=5
    )

    experience_level: str = "beginner"

    hours_per_week: int = Field(
        default=10,
        ge=1,
        le=168,
    )

    deadline: str | None = None


class ResearchResource(BaseModel):

    title: str

    resource_type: str

    description: str

    url: str | None = None

    cover_url: str | None = None

    subjects: list[str] = Field(
        default_factory=list
    )

    access_type: str | None = None

    action_label: str | None = None

    read_url: str | None = None

    borrow_url: str | None = None

    source: str | None = None

    relevance_score: int | None = None


class LearningTopic(BaseModel):

    topic: str

    why_it_matters: str

    estimated_hours: int

    resources: list[ResearchResource] = []


class ResearchPaper(BaseModel):

    title: str

    authors: list[str]

    year: int

    description: str

    url: str | None = None


class ResearchMilestone(BaseModel):

    title: str

    description: str

    estimated_hours: int


class ResearchDailyTask(BaseModel):

    day: int

    title: str

    description: str

    estimated_minutes: int

    milestone: str

    resource_title: str | None = None

    resource_url: str | None = None


class ResearchPlan(BaseModel):

    question: str

    understanding: str

    topics: list[str]

    prerequisites: list[str]

    learning_path: list[LearningTopic]

    foundational_papers: list[ResearchPaper]

    recent_papers: list[ResearchPaper]

    datasets: list[ResearchResource]

    books: list[ResearchResource]

    milestones: list[ResearchMilestone]

    daily_tasks: list[ResearchDailyTask]


class ResearchPlan(BaseModel):
    question: str
    understanding: str

    research_scope: list[str]
    key_concepts: list[str]
    established_approaches: list[str]
    challenges: list[str]
    research_directions: list[str]
    research_gaps: list[str]

    topics: list[str]
    prerequisites: list[str]

    learning_path: list[LearningTopic]

    foundational_papers: list[ResearchPaper]
    recent_papers: list[ResearchPaper]

    datasets: list[ResearchResource]
    books: list[ResearchResource]

    milestones: list[ResearchMilestone]
    daily_tasks: list[ResearchDailyTask]