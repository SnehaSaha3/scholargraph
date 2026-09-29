import json

from pydantic import BaseModel, ValidationError

from app.graph.state import ResearchState
from app.models.llm import get_llm


class RouterResult(BaseModel):
    domain: str
    subtopics: list[str]


def router_agent(state: ResearchState) -> dict:

    llm = get_llm()

    prompt = f"""
You are the routing agent for ScholarGraph.

Analyze this research question:

{state["question"]}

Identify:

1. The primary academic or research domain.
2. 3 to 6 focused research subtopics.

Do not answer the research question.

Return ONLY valid JSON.

The JSON MUST have exactly this structure:

{{
  "domain": "primary research domain",
  "subtopics": [
    "subtopic 1",
    "subtopic 2",
    "subtopic 3"
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

    # Handle accidental markdown fences.
    if content.startswith("```"):

        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

    try:

        data = json.loads(content)

        result = RouterResult.model_validate(
            data
        )

    except (
        json.JSONDecodeError,
        ValidationError,
    ) as error:

        print(
            "[router] Invalid model output:"
        )

        print(content)

        raise RuntimeError(
            "Router returned invalid JSON."
        ) from error

    return {
        "domain": result.domain,
        "subtopics": result.subtopics,
    }