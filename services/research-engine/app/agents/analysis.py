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


def compact_papers(papers: list[dict]) -> list[dict]:
    return [
        {
            "title": paper.get("title", ""),
            "year": paper.get("year"),
        }
        for paper in papers[:5]
    ]


def compact_resources(resources: list[dict]) -> list[dict]:
    return [
        {
            "title": resource.get("title", ""),
            "subjects": resource.get("subjects", [])[:4],
        }
        for resource in resources[:5]
    ]


def analysis_agent(state: ResearchState) -> dict:
    llm = get_llm()

    papers = (
        state.get("foundational_papers", [])
        + state.get("recent_papers", [])
    )

    compact_evidence = {
        "papers": compact_papers(papers),
        "datasets": compact_resources(
            state.get("datasets", [])
        ),
        "books": compact_resources(
            state.get("books", [])
        ),
    }

    prompt = f"""
You are ScholarGraph's research analysis agent.

Research question:
{state["question"]}

Domain:
{state.get("domain", "")}

Subtopics:
{", ".join(state.get("subtopics", [])[:4])}

Retrieved evidence:
{json.dumps(compact_evidence, ensure_ascii=False)}

Create a concise research brief.

Return ONLY valid JSON:

{{
  "understanding": "2 concise sentences",
  "research_scope": ["item", "item", "item"],
  "key_concepts": ["item", "item", "item", "item"],
  "established_approaches": ["item", "item", "item"],
  "challenges": ["item", "item", "item"],
  "research_directions": ["item", "item", "item"],
  "research_gaps": ["item", "item", "item"]
}}

Important:
- Use the retrieved evidence only as evidence.
- Do not invent papers, datasets, books, findings, statistics or citations.
- Titles alone do not prove experimental findings.
- If evidence is insufficient, say so.
- Treat research gaps as potential gaps unless directly established.
- Keep every list concise.
- Do not answer with Markdown.
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
