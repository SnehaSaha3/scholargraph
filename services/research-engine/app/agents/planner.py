from pydantic import BaseModel

from app.graph.state import ResearchState
from app.models.llm import get_llm


class MilestoneResult(BaseModel):
    title: str
    description: str
    estimated_hours: int


class PlannerResult(BaseModel):
    understanding: str
    milestones: list[MilestoneResult]


def planner_agent(state: ResearchState) -> dict:

    llm = get_llm()

    papers = state.get("recent_papers", [])
    datasets = state.get("datasets", [])

    paper_context = "\n".join(
        f"- {paper['title']} ({paper['year']})"
        for paper in papers
    )

    dataset_context = "\n".join(
        f"- {dataset['title']}"
        for dataset in datasets
    )

    learning_context = "\n".join(
        f"- {topic['topic']} "
        f"({topic['estimated_hours']} hours)"
        for topic in state.get("learning_topics", [])
    )

    prompt = f"""
You are the research planning agent for ScholarGraph.

You MUST return the requested structured output.
Do not write a normal answer.
Do not use Markdown tables.
Do not use headings.
Do not explain your reasoning outside the structured fields.

Research question:
{state["question"]}

Domain:
{state["domain"]}

Subtopics:
{", ".join(state["subtopics"])}

Prerequisites:
{", ".join(state.get("prerequisites", []))}

Learning topics:
{learning_context}

Recent papers:
{paper_context}

Datasets:
{dataset_context}

Fill these structured fields:

understanding:
A concise explanation of how the research question should
be approached.

milestones:
Create 4 to 6 practical research milestones.

Each milestone MUST contain exactly:
- title
- description
- estimated_hours

The milestones should progress through:
1. understanding
2. literature review
3. datasets and resources
4. experimentation
5. analysis
6. research direction

Use the supplied papers and datasets when relevant.

Do not invent paper titles.
Do not invent dataset names.

Return ONLY the structured result required by the schema.
    """

    structured_llm = llm.with_structured_output(PlannerResult)

    result = structured_llm.invoke(prompt)

    return {
        "understanding": result.understanding,
        "milestones": [
            item.model_dump()
            for item in result.milestones
        ],
    }