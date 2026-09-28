from pydantic import BaseModel

from app.graph.state import ResearchState
from app.models.llm import get_llm


class LearningTopicResult(BaseModel):
    topic: str
    why_it_matters: str
    estimated_hours: int


class DomainResult(BaseModel):
    prerequisites: list[str]
    learning_topics: list[LearningTopicResult]


def domain_agent(state: ResearchState) -> dict:
    llm = get_llm()

    prompt = f"""
You are the domain analysis agent for ScholarGraph.

Research question:
{state["question"]}

Primary domain:
{state["domain"]}

Subtopics:
{", ".join(state["subtopics"])}

Determine what a beginner should understand before attempting
serious research on this problem.

Create:

1. Prerequisites
2. Learning topics

For every learning topic provide:
- topic
- why_it_matters
- estimated_hours

Do not invent papers or datasets.

Keep the learning path practical and research-oriented.
"""

    structured_llm = llm.with_structured_output(DomainResult)

    result = structured_llm.invoke(prompt)

    return {
        "prerequisites": result.prerequisites,
        "learning_topics": [
            item.model_dump()
            for item in result.learning_topics
        ],
    }