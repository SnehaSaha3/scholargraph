from app.graph.research_graph import build_research_graph

from app.schemas.research import (
    LearningTopic,
    ResearchDailyTask,
    ResearchMilestone,
    ResearchPaper,
    ResearchPlan,
    ResearchRequest,
    ResearchResource,
)


def build_daily_tasks(
    result: dict,
) -> list[dict]:

    tasks: list[dict] = []

    learning_topics = result.get(
        "learning_topics",
        [],
    )

    papers = (
        result.get("foundational_papers", [])
        + result.get("recent_papers", [])
    )

    books = result.get(
        "books",
        [],
    )

    datasets = result.get(
        "datasets",
        [],
    )

    milestones = result.get(
        "milestones",
        [],
    )

    # Keep the V0 daily workload reasonable.
    daily_minutes = 60

    # ---------------------------------------------------------
    # Days 1-4: foundations
    # ---------------------------------------------------------

    for topic in learning_topics[:4]:

        day = len(tasks) + 1

        tasks.append(
            {
                "day": day,
                "title": (
                    f"Study: {topic['topic']}"
                ),
                "description": (
                    topic["why_it_matters"]
                ),
                "estimated_minutes": daily_minutes,
                "milestone": "Foundation",
                "resource_title": None,
                "resource_url": None,
            }
        )

    # ---------------------------------------------------------
    # Days 5-7: literature
    # ---------------------------------------------------------

    for paper in papers[:3]:

        day = len(tasks) + 1

        tasks.append(
            {
                "day": day,
                "title": (
                    f"Read: {paper['title']}"
                ),
                "description": (
                    "Read the paper with focus on "
                    "the problem, method, dataset, "
                    "evaluation and limitations."
                ),
                "estimated_minutes": daily_minutes,
                "milestone": "Literature review",
                "resource_title": paper["title"],
                "resource_url": paper.get("url"),
            }
        )

    # ---------------------------------------------------------
    # Days 8-9: books
    # ---------------------------------------------------------

    for book in books[:2]:

        day = len(tasks) + 1

        tasks.append(
            {
                "day": day,
                "title": (
                    f"Study: {book['title']}"
                ),
                "description": (
                    "Use this as foundational reading. "
                    "Focus on concepts directly connected "
                    "to your research question."
                ),
                "estimated_minutes": daily_minutes,
                "milestone": "Foundation",
                "resource_title": book["title"],
                "resource_url": book.get("url"),
            }
        )

    # ---------------------------------------------------------
    # Day 10: dataset investigation
    # ---------------------------------------------------------

    if datasets:

        dataset = datasets[0]

        tasks.append(
            {
                "day": len(tasks) + 1,
                "title": (
                    f"Inspect dataset: "
                    f"{dataset['title']}"
                ),
                "description": (
                    "Inspect the dataset documentation, "
                    "task definition, structure and "
                    "available metadata before deciding "
                    "whether it fits the research problem."
                ),
                "estimated_minutes": daily_minutes,
                "milestone": "Data investigation",
                "resource_title": dataset["title"],
                "resource_url": dataset.get("url"),
            }
        )

    # ---------------------------------------------------------
    # Remaining days: research development
    # ---------------------------------------------------------

    development_tasks = [
        (
            "Compare existing approaches",
            "Compare the methods you encountered in the literature. "
            "Record what problem each method addresses and where "
            "the approaches differ.",
            "Literature review",
        ),
        (
            "Define a baseline",
            "Choose a simple baseline that can be implemented "
            "and evaluated before attempting improvements.",
            "Experimentation",
        ),
        (
            "Design your first experiment",
            "Write down the hypothesis, variables, dataset, "
            "evaluation metric and expected observation.",
            "Experimentation",
        ),
        (
            "Analyze the evidence",
            "Review what the literature and available resources "
            "actually support. Separate evidence from assumptions.",
            "Analysis",
        ),
        (
            "Identify research gaps",
            "Look for limitations, unresolved problems or missing "
            "comparisons across the literature you studied.",
            "Research direction",
        ),
        (
            "Write your next research direction",
            "Turn your observations into one concrete research "
            "direction and explain why it deserves investigation.",
            "Research direction",
        ),
    ]

    for title, description, milestone in development_tasks:

        if len(tasks) >= 14:
            break

        tasks.append(
            {
                "day": len(tasks) + 1,
                "title": title,
                "description": description,
                "estimated_minutes": daily_minutes,
                "milestone": milestone,
                "resource_title": None,
                "resource_url": None,
            }
        )

    return tasks[:14]


def create_research_plan(
    request: ResearchRequest,
) -> ResearchPlan:

    graph = build_research_graph()

    result = graph.invoke(
        {
            "question": request.question,
            "experience_level": (
                request.experience_level
            ),
            "hours_per_week": (
                request.hours_per_week
            ),
            "deadline": request.deadline,
        }
    )

    # ---------------------------------------------------------
    # Learning path
    # ---------------------------------------------------------

    learning_path = [
        LearningTopic(
            topic=item["topic"],
            why_it_matters=item[
                "why_it_matters"
            ],
            estimated_hours=item[
                "estimated_hours"
            ],
            resources=[],
        )
        for item in result.get(
            "learning_topics",
            [],
        )
    ]

    # ---------------------------------------------------------
    # Foundational papers
    # ---------------------------------------------------------

    foundational_papers = [
        ResearchPaper(
            title=paper["title"],
            authors=paper["authors"],
            year=paper["year"],
            description=paper["description"],
            url=paper.get("url"),
        )
        for paper in result.get(
            "foundational_papers",
            [],
        )
    ]

    # ---------------------------------------------------------
    # Recent papers
    # ---------------------------------------------------------

    recent_papers = [
        ResearchPaper(
            title=paper["title"],
            authors=paper["authors"],
            year=paper["year"],
            description=paper["description"],
            url=paper.get("url"),
        )
        for paper in result.get(
            "recent_papers",
            [],
        )
    ]

    # ---------------------------------------------------------
    # Datasets
    # ---------------------------------------------------------

    datasets = [
        ResearchResource(
            title=dataset["title"],
            resource_type=dataset[
                "resource_type"
            ],
            description=dataset[
                "description"
            ],
            url=dataset.get("url"),
            cover_url=dataset.get(
                "cover_url"
            ),
        )
        for dataset in result.get(
            "datasets",
            [],
        )
    ]

    # ---------------------------------------------------------
    # Books
    # ---------------------------------------------------------

    books = [
    ResearchResource(
        title=book["title"],
        resource_type=book["resource_type"],
        description=book["description"],
        url=book.get("url"),
        cover_url=book.get("cover_url"),
        subjects=book.get(
            "subjects",
            [],
        ),
        access_type=book.get(
            "access_type"
        ),
        action_label=book.get(
            "action_label"
        ),
        read_url=book.get(
            "read_url"
        ),
        borrow_url=book.get(
            "borrow_url"
        ),
        source=book.get(
            "source"
        ),
        relevance_score=book.get(
            "relevance_score"
        ),
    )
    for book in result.get(
        "books",
        [],
    )
]

    # ---------------------------------------------------------
    # Milestones
    # ---------------------------------------------------------

    milestones = [
        ResearchMilestone(
            title=item["title"],
            description=item[
                "description"
            ],
            estimated_hours=item[
                "estimated_hours"
            ],
        )
        for item in result.get(
            "milestones",
            [],
        )
    ]

    # ---------------------------------------------------------
    # Daily research track
    # ---------------------------------------------------------

    daily_tasks = [
        ResearchDailyTask(
            day=task["day"],
            title=task["title"],
            description=task[
                "description"
            ],
            estimated_minutes=task[
                "estimated_minutes"
            ],
            milestone=task[
                "milestone"
            ],
            resource_title=task.get(
                "resource_title"
            ),
            resource_url=task.get(
                "resource_url"
            ),
        )
        for task in build_daily_tasks(
            result
        )
    ]

    # ---------------------------------------------------------
    # Final response
    # ---------------------------------------------------------

    return ResearchPlan(
        question=request.question,

        understanding=result.get(
            "understanding",
            "",
        ),

        topics=result.get(
            "subtopics",
            [],
        ),

        prerequisites=result.get(
            "prerequisites",
            [],
        ),

        learning_path=learning_path,

        foundational_papers=foundational_papers,

        recent_papers=recent_papers,

        datasets=datasets,

        books=books,

        milestones=milestones,

        daily_tasks=daily_tasks,

        research_scope=result.get(
            "research_scope",
            [],
        ),

        key_concepts=result.get(
            "key_concepts",
            [],
        ),

        established_approaches=result.get(
            "established_approaches",
            [],
        ),

        challenges=result.get(
            "challenges",
            [],
        ),

        research_directions=result.get(
            "research_directions",
            [],
        ),

        research_gaps=result.get(
            "research_gaps",
            [],
        ),
    )