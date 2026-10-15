
import json
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from app.graph.state import ResearchState
from app.models.llm import get_llm


class MilestoneResult(BaseModel):
    title: str
    description: str
    estimated_hours: int = Field(ge=1)


class PlannerResult(BaseModel):
    understanding: str
    milestones: list[MilestoneResult] = Field(
        min_length=4,
        max_length=6,
    )


def _safe_text(value: Any) -> str:
    """Convert optional state values into safe prompt text."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value)


def _format_resources(
    resources: list,
    fields: tuple[str, ...],
) -> str:
    """Format supplied resources without inventing metadata."""
    lines = []

    for resource in resources:
        if not isinstance(resource, dict):
            continue

        parts = []

        for field in fields:
            value = resource.get(field)

            if value is not None and str(value).strip():
                parts.append(f"{field}: {value}")

        if parts:
            lines.append("- " + " | ".join(parts))

    return "\n".join(lines) or "None supplied."


def _format_learning_topics(topics: list) -> str:
    lines = []

    for topic in topics[:8]:
        if not isinstance(topic, dict):
            continue

        name = _safe_text(topic.get("topic"))
        hours = topic.get("estimated_hours")

        if not name:
            continue

        if hours is not None:
            lines.append(f"- {name} ({hours} hours)")
        else:
            lines.append(f"- {name}")

    return "\n".join(lines) or "None supplied."


def _extract_response_content(response: Any) -> str:
    """Handle string and content-block LLM response formats."""
    content = getattr(response, "content", response)

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts = []

        for part in content:
            if isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    parts.append(text)
            elif isinstance(part, str):
                parts.append(part)

        return "\n".join(parts).strip()

    return str(content).strip()


def _parse_json(content: str) -> dict:
    """Parse JSON while tolerating a surrounding Markdown fence."""
    content = content.strip()

    if content.startswith("```"):
        lines = content.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        content = "\n".join(lines).strip()

    # Accept a JSON object surrounded by incidental model text.
    if not content.startswith("{"):
        start = content.find("{")
        end = content.rfind("}")

        if start != -1 and end > start:
            content = content[start:end + 1]

    data = json.loads(content)

    if not isinstance(data, dict):
        raise ValueError("Planner response must be a JSON object.")

    return data


def planner_agent(state: ResearchState) -> dict:
    """
    Generate an evidence-aware research roadmap.

    The planner organizes research activities and milestones.
    It does not inspect repositories or generate implementation plans.
    """
    llm = get_llm()

    question = _safe_text(state.get("question"))
    domain = _safe_text(state.get("domain"))

    subtopics = state.get("subtopics") or []
    prerequisites = state.get("prerequisites") or []

    if not isinstance(subtopics, list):
        subtopics = []

    if not isinstance(prerequisites, list):
        prerequisites = []

    recent_papers = state.get("recent_papers") or []
    foundational_papers = state.get("foundational_papers") or []
    datasets = state.get("datasets") or []
    books = state.get("books") or []
    learning_topics = state.get("learning_topics") or []

    if not isinstance(recent_papers, list):
        recent_papers = []

    if not isinstance(foundational_papers, list):
        foundational_papers = []

    if not isinstance(datasets, list):
        datasets = []

    if not isinstance(books, list):
        books = []

    if not isinstance(learning_topics, list):
        learning_topics = []

    if not question:
        raise ValueError(
            "Cannot create a research plan without a research question."
        )

    papers = recent_papers + foundational_papers

    paper_context = _format_resources(
        papers,
        ("title", "year", "authors", "url", "doi"),
    )

    dataset_context = _format_resources(
        datasets,
        ("title", "description", "url", "source"),
    )

    book_context = _format_resources(
        books,
        ("title", "author", "url", "description"),
    )

    learning_context = _format_learning_topics(learning_topics)

    subtopics_text = "\n".join(
        f"- {_safe_text(topic)}"
        for topic in subtopics
        if _safe_text(topic)
    ) or "None supplied."

    prerequisites_text = "\n".join(
        f"- {_safe_text(item)}"
        for item in prerequisites
        if _safe_text(item)
    ) or "None supplied."

    prompt = f"""
You are ScholarGraph's research planning agent.

YOUR RESPONSIBILITY

Create a coherent roadmap that helps a user understand,
organize, and make progress on a research question.

You are NOT the repository implementation agent.
Do not recommend code implementation steps unless they are
relevant research activities, such as evaluating a baseline
or testing a research hypothesis.

RESEARCH QUESTION
{question}

DOMAIN
{domain or "Not specified."}

SUBTOPICS
{subtopics_text}

PREREQUISITES
{prerequisites_text}

SUGGESTED LEARNING TOPICS
{learning_context}

SUPPLIED PAPERS
{paper_context}

SUPPLIED DATASETS
{dataset_context}

SUPPLIED BOOKS
{book_context}

PLANNING PRINCIPLES

1. UNDERSTAND THE USER'S RESEARCH STAGE

Determine whether the question is:
- Broad and exploratory.
- Focused on a particular problem.
- Ready for literature synthesis.
- Ready for dataset assessment or experimentation.
- Focused on analyzing existing results.

Adapt the roadmap to that stage.

2. HANDLE BROAD QUESTIONS PROPERLY

For a broad question such as "What are the emerging technology
research opportunities?", do not immediately assign unrelated
study tasks such as quantum computing, dentistry AI, edge
computing, and synthetic biology.

Instead, organize the work around:
- Identifying specific candidate research problems.
- Comparing their importance and scope.
- Reviewing relevant existing work.
- Checking available evidence and data.
- Assessing feasibility and possible research gaps.
- Selecting one concrete research direction.

If illustrative topics are useful, describe them as candidates
to investigate, not as established research opportunities.

3. MAKE EVERY MILESTONE ACTIONABLE

Each milestone must state:
- What the user should do.
- What question the activity should answer.
- What outcome or deliverable should result.

Avoid vague titles and descriptions such as "Study AI"
or "Explore quantum computing."

Prefer concrete activities such as:
"Compare existing methods for detecting contradictions
between scientific papers and record how they are evaluated."

Only use an example like this if it fits the user's question.

4. FOLLOW A LOGICAL PROGRESSION

Select 4 to 6 milestones appropriate to the question.

The overall progression should cover relevant stages such as:
- Research question clarification.
- Foundational learning where needed.
- Literature review and comparison.
- Dataset and resource assessment.
- Experiment design or investigation when appropriate.
- Evidence analysis and research direction.

Do not force every stage into every plan.
For a broad question, prioritize exploration and selection
before experimentation.

5. KEEP THE ROADMAP COHERENT

All milestones must contribute to the same research question.
Do not mix unrelated domains just because they are popular.
Use supplied subtopics when relevant, but do not treat them
as proof that every subtopic belongs in the plan.

Avoid repeating the same task under different milestones.

6. RESPECT AVAILABLE EVIDENCE

You may only refer to papers listed in SUPPLIED PAPERS.
You may only refer to datasets listed in SUPPLIED DATASETS.
You may only refer to books listed in SUPPLIED BOOKS.

Never invent titles, authors, links, dataset names, findings,
citations, or resource availability.

Do not claim a paper establishes a research gap unless its
supplied information supports that statement.
Do not claim a dataset is relevant, accessible, or suitable
without adequate evidence.

If no relevant resources are supplied, make resource discovery
and verification part of the plan. Do not invent resources.

A possible research gap is a hypothesis to investigate,
not proof of novelty.

7. ESTIMATE TIME REALISTICALLY

Assign a positive integer number of hours to each milestone.
Keep the workload reasonable for the scope of the activity.
Do not assume the user has already mastered prerequisites.

8. WRITE CLEARLY

Use concise, professional language.
Avoid marketing language, generic advice, and unnecessary jargon.
Explain what the user will accomplish, not just which topic
they should read about.

OUTPUT REQUIREMENTS

Return only valid JSON with exactly this structure:

{{
  "understanding": "A concise explanation of the research question,
  its current stage, and the recommended approach.",
  "milestones": [
    {{
      "title": "A specific and actionable milestone",
      "description": "Activities, expected outcome, and why this
      milestone advances the research.",
      "estimated_hours": 3
    }}
  ]
}}

Return between 4 and 6 milestones.
Do not add Markdown fences or text outside the JSON.
"""

    response = llm.invoke(prompt)
    content = _extract_response_content(response)

    try:
        data = _parse_json(content)
        result = PlannerResult.model_validate(data)

    except (json.JSONDecodeError, ValidationError, ValueError) as error:
        print("[planner] Invalid model output:")
        print(content)

        raise RuntimeError(
            "Planner returned invalid JSON or an invalid roadmap."
        ) from error

    return {
        "understanding": result.understanding,
        "milestones": [
            milestone.model_dump()
            for milestone in result.milestones
        ],
    }
