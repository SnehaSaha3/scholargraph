import json

from pydantic import BaseModel, ValidationError

from app.graph.state import ResearchState
from app.models.llm import get_llm


class MilestoneResult(BaseModel):

    title: str

    description: str

    estimated_hours: int


class PlannerResult(BaseModel):

    understanding: str

    milestones: list[MilestoneResult]


def planner_agent(
    state: ResearchState,
) -> dict:

    llm = get_llm()

    papers = (
        state.get("recent_papers", [])
        + state.get("foundational_papers", [])
    )

    datasets = state.get(
        "datasets",
        []
    )

    books = state.get(
        "books",
        []
    )

    paper_context = "\n".join(
        f"- {paper['title']} ({paper['year']})"
        for paper in papers
    )

    dataset_context = "\n".join(
        f"- {dataset['title']}"
        for dataset in datasets
    )

    book_context = "\n".join(
        f"- {book['title']}"
        for book in books
    )

    learning_context = "\n".join(
        f"- {topic['topic']} "
        f"({topic['estimated_hours']} hours)"
        for topic in state.get(
            "learning_topics",
            []
        )[:8]
    )

    prompt = f"""
You are the research planning agent for ScholarGraph.

Create a practical research roadmap.

Research question:
{state["question"]}

Domain:
{state["domain"]}

Subtopics:
{", ".join(state["subtopics"])}

Prerequisites:
{", ".join(
    state.get("prerequisites", [])
)}

Learning topics:
{learning_context}

VERIFIED PAPERS:
{paper_context or "None found."}

VERIFIED DATASETS:
{dataset_context or "None found."}

VERIFIED BOOKS:
{book_context or "None found."}

Create:

1. A concise explanation of how the research
   question should be approached.

2. 4 to 6 practical milestones.

The milestones should progress through:

understanding
literature
resources
experimentation
analysis
research direction

CRITICAL RESOURCE RULES:

- You may ONLY refer to papers listed above.
- You may ONLY refer to datasets listed above.
- You may ONLY refer to books listed above.
- Never invent a resource.
- Never invent a paper title.
- Never invent a dataset name.
- Never invent a book title.
- If no resource exists in the supplied list,
  do not create one.
- Do not claim a dataset is suitable unless
  the supplied information supports that claim.

Return ONLY valid JSON.

Use exactly this structure:

{{
  "understanding": "string",
  "milestones": [
    {{
      "title": "string",
      "description": "string",
      "estimated_hours": 2
    }}
  ]
}}

Do not use Markdown.
Do not use ```json.
Do not add explanations.
"""

    response = llm.invoke(prompt)

    content = response.content

    if isinstance(content, list):

        content = "".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict)
        )

    content = str(content).strip()

    if content.startswith("```"):

        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

    try:

        data = json.loads(content)

        result = PlannerResult.model_validate(
            data
        )

    except (
        json.JSONDecodeError,
        ValidationError,
    ) as error:

        print(
            "[planner] Invalid model output:"
        )

        print(content)

        raise RuntimeError(
            "Planner returned invalid JSON."
        ) from error

    return {
        "understanding": result.understanding,

        "milestones": [
            milestone.model_dump()
            for milestone in result.milestones
        ],
    }