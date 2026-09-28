from app.graph.research_graph import build_research_graph
from app.schemas.research import (
    LearningTopic,
    ResearchMilestone,
    ResearchPaper,
    ResearchPlan,
    ResearchRequest,
    ResearchResource,
)


def create_research_plan(
    request: ResearchRequest,
) -> ResearchPlan:

    graph = build_research_graph()

    result = graph.invoke(
        {
            "question": request.question,
            "experience_level": request.experience_level,
            "hours_per_week": request.hours_per_week,
            "deadline": request.deadline,
        }
    )

    learning_path = [
        LearningTopic(
            topic=item["topic"],
            why_it_matters=item["why_it_matters"],
            estimated_hours=item["estimated_hours"],
            resources=[],
        )
        for item in result.get("learning_topics", [])
    ]

    foundational_papers = [
        ResearchPaper(
            title=paper["title"],
            authors=paper["authors"],
            year=paper["year"],
            description=paper["description"],
            url=paper["url"],
        )
        for paper in result.get("foundational_papers", [])
    ]

    recent_papers = [
        ResearchPaper(
            title=paper["title"],
            authors=paper["authors"],
            year=paper["year"],
            description=paper["description"],
            url=paper["url"],
        )
        for paper in result.get("recent_papers", [])
    ]

    datasets = [
        ResearchResource(
            title=dataset["title"],
            resource_type=dataset["resource_type"],
            description=dataset["description"],
            url=dataset["url"],
        )
        for dataset in result.get("datasets", [])
    ]

    milestones = [
        ResearchMilestone(
            title=item["title"],
            description=item["description"],
            estimated_hours=item["estimated_hours"],
        )
        for item in result.get("milestones", [])
    ]

    return ResearchPlan(
        question=request.question,
        understanding=result.get("understanding", ""),
        topics=result.get("subtopics", []),
        prerequisites=result.get("prerequisites", []),
        learning_path=learning_path,
        foundational_papers=foundational_papers,
        recent_papers=recent_papers,
        datasets=datasets,
        milestones=milestones,
    )