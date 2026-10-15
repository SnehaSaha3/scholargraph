import json

from pydantic import BaseModel, ValidationError

from app.graph.state import ResearchState
from app.models.llm import get_llm


class AnalysisResult(BaseModel):
    understanding: str
    research_scope: list[str]
    key_concepts: list[str]
    established_approaches: list[str]
    challenges: list[str]
    research_directions: list[str]
    research_gaps: list[str]


def paper_evidence(papers: list[dict]) -> list[dict]:
    return [
        {
            "title": paper.get("title", ""),
            "year": paper.get("year"),
            "summary": (paper.get("description") or "")[:300],
        }
        for paper in papers
    ]


def title_list(resources: list[dict], limit: int = 5) -> list[str]:
    return [resource.get("title", "") for resource in resources[:limit]]


def analysis_agent(state: ResearchState) -> dict:
    llm = get_llm()

    evidence = {
        "recent_papers": paper_evidence(
            state.get("recent_papers", [])[:5]
        ),
        "foundational_papers": paper_evidence(
            state.get("foundational_papers", [])[:3]
        ),
        "datasets": title_list(state.get("datasets", [])),
        "books": title_list(state.get("books", [])),
    }

    prompt = f"""
You are ScholarGraph's research analysis agent.

Research question:
{state["question"]}

Domain:
{state.get("domain", "")}

Subtopics:
{", ".join(state.get("subtopics", [])[:4])}

Retrieved evidence (search results, not a complete literature review):
{json.dumps(evidence, ensure_ascii=False)}

Write a research brief that helps someone start working on this question.

How to use your sources of knowledge:
- Use your general knowledge of the field to explain the topic and its structure.
- Use the retrieved evidence to ground specific claims. Describe a paper's findings only when its summary states them.
- If the question covers a whole field or asks for a landscape (for example "emerging research fields"), research_scope and research_directions must cover the field's main subareas, not only the subareas that appear in the retrieved papers. Say in "understanding" when the retrieved papers cover only part of the field.
- If the evidence is thin or off-topic for the question, say so in "understanding" instead of building the brief around it.

Rules:
- key_concepts are the ideas a newcomer needs for this question, not terms copied from paper titles.
- established_approaches are methods used in the field, not paper titles rephrased.
- Treat research_gaps as potential gaps unless the evidence establishes them.
- Do not invent papers, datasets, books, statistics or citations.
- Every list item is a short plain-text string. No Markdown.

Return ONLY valid JSON:

{{
  "understanding": "2 to 3 concise sentences",
  "research_scope": ["item", "item", "item"],
  "key_concepts": ["item", "item", "item", "item"],
  "established_approaches": ["item", "item", "item"],
  "challenges": ["item", "item", "item"],
  "research_directions": ["item", "item", "item"],
  "research_gaps": ["item", "item", "item"]
}}
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
        result = AnalysisResult.model_validate(data)

    except (json.JSONDecodeError, ValidationError) as error:
        print("[analysis] Invalid model output:")
        print(content)
        raise RuntimeError(
            "Research analysis returned invalid JSON."
        ) from error

    usage = getattr(response, "usage_metadata", None)

    if usage:
        print("[analysis] token usage:", usage)

    return result.model_dump()