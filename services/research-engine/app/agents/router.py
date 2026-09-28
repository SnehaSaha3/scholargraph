from pydantic import BaseModel

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
2. 3 to 6 important subtopics that should be investigated.

Keep the result focused on research.

Do not answer the research question.

Return only the requested structured fields.
"""

    structured_llm = llm.with_structured_output(RouterResult)

    result = structured_llm.invoke(prompt)

    return {
        "domain": result.domain,
        "subtopics": result.subtopics,
    }