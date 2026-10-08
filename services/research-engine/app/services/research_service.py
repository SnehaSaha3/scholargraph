from app.graph.research_graph import build_research_graph
from app.schemas.research import (
    LearningTopic,
    ResearchDailyTask,
    ResearchDiscussionRequest,
    ResearchDiscussionResponse,
    ResearchExploration,
    ResearchMilestone,
    ResearchPaper,
    ResearchPlan,
    ResearchRequest,
    ResearchResource,
)
from app.models.llm import get_llm
import json
from pydantic import BaseModel, ValidationError


def _resources(items: list[dict]) -> list[ResearchResource]:
    return [ResearchResource.model_validate(item) for item in items]


def explore_research(request: ResearchRequest) -> ResearchExploration:
    graph = build_research_graph()
    result = graph.invoke({
        "question": request.question,
        "experience_level": request.experience_level,
        "hours_per_week": request.hours_per_week,
        "deadline": request.deadline,
    })

    papers = result.get("foundational_papers", []) + result.get("recent_papers", [])
    return ResearchExploration(
        question=request.question,
        understanding=result.get("understanding", ""),
        research_scope=result.get("research_scope", []),
        key_concepts=result.get("key_concepts", []),
        established_approaches=result.get("established_approaches", []),
        challenges=result.get("challenges", []),
        research_directions=result.get("research_directions", []),
        research_gaps=result.get("research_gaps", []),
        topics=result.get("subtopics", []),
        prerequisites=result.get("prerequisites", []),
        foundational_papers=[ResearchPaper.model_validate(x) for x in result.get("foundational_papers", [])],
        recent_papers=[ResearchPaper.model_validate(x) for x in result.get("recent_papers", [])],
        datasets=_resources(result.get("datasets", [])),
        books=_resources(result.get("books", [])),
    )


def _clean_json(content):
    if isinstance(content, list):
        content = "".join(part.get("text", "") for part in content if isinstance(part, dict))
    content = str(content).strip()
    if content.startswith("```"):
        content = content.replace("```json", "").replace("```", "").strip()
    return content


def discuss_research(request: ResearchDiscussionRequest) -> ResearchDiscussionResponse:
    llm = get_llm()
    research = request.research
    papers = research.foundational_papers + research.recent_papers
    evidence = {
        "understanding": research.understanding,
        "scope": research.research_scope,
        "approaches": research.established_approaches,
        "challenges": research.challenges,
        "directions": research.research_directions,
        "gaps": research.research_gaps,
        "papers": [{"title": p.title, "year": p.year, "description": p.description} for p in papers[:8]],
        "datasets": [{"title": d.title, "description": d.description} for d in research.datasets[:5]],
    }
    history = "\n".join(f"{m.role}: {m.content}" for m in request.messages[-6:])
    prompt = f"""
You are ScholarGraph's research discussion agent.
Help the researcher think about the research question, not create a generic plan.

Research question:
{request.question}

Research context:
{json.dumps(evidence, ensure_ascii=False)}

Recent discussion:
{history or "None"}

User question:
{request.prompt}

Return ONLY JSON:
{{
  "answer": "concise evidence-aware answer",
  "supporting_paper_titles": ["exact title from supplied papers"],
  "suggested_questions": ["useful follow-up question", "useful follow-up question"]
}}

Rules:
- Do not invent papers or citations.
- supporting_paper_titles must exactly match supplied paper titles.
- Distinguish evidence from inference.
- Challenge weak assumptions when appropriate.
- Do not automatically produce a schedule or daily plan.
- Keep the answer focused and practical.
- No Markdown fences.
"""
    response = llm.invoke(prompt)
    try:
        data = json.loads(_clean_json(response.content))
        title_map = {p.title: p for p in papers}
        supporting = [title_map[t] for t in data.get("supporting_paper_titles", []) if t in title_map]
        return ResearchDiscussionResponse(
            answer=data.get("answer", ""),
            supporting_papers=supporting,
            suggested_questions=data.get("suggested_questions", [])[:4],
        )
    except (json.JSONDecodeError, ValidationError, TypeError) as error:
        raise RuntimeError("Research discussion returned invalid JSON.") from error


def _build_daily_tasks(result: dict) -> list[dict]:
    tasks = []
    learning = result.get("learning_topics", [])
    papers = result.get("foundational_papers", []) + result.get("recent_papers", [])
    datasets = result.get("datasets", [])
    for topic in learning[:4]:
        tasks.append({"day": len(tasks)+1, "title": f"Study: {topic['topic']}", "description": topic["why_it_matters"], "estimated_minutes": 60, "milestone": "Foundation", "resource_title": None, "resource_url": None})
    for paper in papers[:3]:
        tasks.append({"day": len(tasks)+1, "title": f"Read: {paper['title']}", "description": "Read the problem, method, dataset, evaluation and limitations.", "estimated_minutes": 60, "milestone": "Literature review", "resource_title": paper["title"], "resource_url": paper.get("url")})
    if datasets:
        d = datasets[0]
        tasks.append({"day": len(tasks)+1, "title": f"Inspect dataset: {d['title']}", "description": "Inspect documentation, structure and metadata before deciding whether it fits.", "estimated_minutes": 60, "milestone": "Data investigation", "resource_title": d["title"], "resource_url": d.get("url")})
    for title, desc, milestone in [
        ("Compare existing approaches", "Compare methods from the literature and their differences.", "Literature review"),
        ("Define a baseline", "Choose a simple baseline that can be evaluated.", "Experimentation"),
        ("Design the first experiment", "Define hypothesis, variables, data and evaluation metric.", "Experimentation"),
        ("Analyze the evidence", "Separate what the evidence supports from assumptions.", "Analysis"),
        ("Identify research gaps", "Record unresolved problems and missing comparisons.", "Research direction"),
        ("Write the next research direction", "Turn observations into one concrete direction.", "Research direction"),
    ]:
        if len(tasks) >= 14: break
        tasks.append({"day": len(tasks)+1, "title": title, "description": desc, "estimated_minutes": 60, "milestone": milestone, "resource_title": None, "resource_url": None})
    return tasks[:14]


def create_research_plan(request: ResearchRequest) -> ResearchPlan:
    exploration = explore_research(request)
    from app.agents.planner import planner_agent
    state = exploration.model_dump()
    state["domain"] = "research"
    state["subtopics"] = exploration.topics
    state["learning_topics"] = [
        {
            "topic": topic,
            "why_it_matters": "Build the knowledge needed to investigate the research question.",
            "estimated_hours": 2,
        }
        for topic in exploration.topics
    ]
    planned = planner_agent(state)
    learning_path = [
        LearningTopic(
            topic=x["topic"],
            why_it_matters=x["why_it_matters"],
            estimated_hours=x["estimated_hours"],
            resources=[],
        )
        for x in state.get("learning_topics", [])
    ]
    # planner now receives exploration plus the existing resource evidence.
    return ResearchPlan(
        question=request.question,
        understanding=planned.get("understanding", exploration.understanding),
        research_scope=exploration.research_scope,
        key_concepts=exploration.key_concepts,
        established_approaches=exploration.established_approaches,
        challenges=exploration.challenges,
        research_directions=exploration.research_directions,
        research_gaps=exploration.research_gaps,
        topics=exploration.topics,
        prerequisites=exploration.prerequisites,
        learning_path=learning_path,
        foundational_papers=exploration.foundational_papers,
        recent_papers=exploration.recent_papers,
        datasets=exploration.datasets,
        books=exploration.books,
        milestones=[ResearchMilestone.model_validate(x) for x in planned.get("milestones", [])],
        daily_tasks=[ResearchDailyTask.model_validate(x) for x in _build_daily_tasks(state)],
    )
