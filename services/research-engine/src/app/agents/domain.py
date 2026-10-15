import json

from pydantic import BaseModel, ValidationError

from app.graph.state import ResearchState
from app.models.llm import get_llm


class LearningTopicResult(BaseModel):

    topic: str

    why_it_matters: str

    estimated_hours: int


class DomainResult(BaseModel):

    prerequisites: list[str]

    learning_topics: list[
        LearningTopicResult
    ]


def domain_agent(
    state: ResearchState,
) -> dict:

    llm = get_llm()

    prompt = f"""
You are the domain analysis agent for ScholarGraph.

Research question:
{state["question"]}

Primary domain:
{state["domain"]}

Subtopics:
{", ".join(state["subtopics"])}

Determine what a beginner should understand
before attempting serious research on this problem.

Create:

1. prerequisites
2. learning_topics

Each learning topic must contain:

- topic
- why_it_matters
- estimated_hours

Keep the learning path practical and research-oriented.

Do not invent papers.
Do not invent datasets.

Return ONLY valid JSON.

Use exactly this structure:

{{
  "prerequisites": [
    "string"
  ],
  "learning_topics": [
    {{
      "topic": "string",
      "why_it_matters": "string",
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

        result = DomainResult.model_validate(
            data
        )

    except (
        json.JSONDecodeError,
        ValidationError,
    ) as error:

        print(
            "[domain] Invalid model output:"
        )

        print(content)

        raise RuntimeError(
            "Domain agent returned invalid JSON."
        ) from error

    return {
        "prerequisites": result.prerequisites,

        "learning_topics": [
            topic.model_dump()
            for topic in result.learning_topics
        ],
    }