import json

from pydantic import BaseModel, ValidationError

from app.graph.state import ResearchState
from app.models.llm import get_llm


class ResearchIntentResult(BaseModel):
    domain: str
    subtopics: list[str]


def research_intent_agent(state: ResearchState) -> dict:
    llm = get_llm()

    prompt = f"""
You are ScholarGraph's research query analyzer.

Research question:
{state["question"]}

Identify:
1. The primary academic/research domain.
2. 2 to 4 focused research subtopics.

Return ONLY valid JSON:

{{
  "domain": "primary research domain",
  "subtopics": [
    "focused subtopic",
    "focused subtopic"
  ]
}}

Rules:
- Keep subtopics concise.
- Do not answer the research question.
- Do not explain your reasoning.
- Do not invent sources.
- No Markdown.
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
        result = ResearchIntentResult.model_validate(data)

    except (json.JSONDecodeError, ValidationError) as error:
        print("[research_intent] Invalid model output:")
        print(content)
        raise RuntimeError(
            "Research intent returned invalid JSON."
        ) from error

    usage = getattr(response, "usage_metadata", None)

    if usage:
        print("[research_intent] token usage:", usage)

    return {
        "domain": result.domain,
        "subtopics": result.subtopics[:4],
    }
