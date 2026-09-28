import httpx

from app.graph.state import ResearchState


OPENALEX_URL = "https://api.openalex.org/works"


def search_openalex(
    query: str,
    per_page: int = 10,
) -> list[dict]:

    response = httpx.get(
        OPENALEX_URL,
        params={
            "search": query,
            "per-page": per_page,
        },
        timeout=20,
    )

    response.raise_for_status()

    data = response.json()

    papers = []

    for item in data.get("results", []):
        authors = [
            author.get("author", {}).get("display_name")
            for author in item.get("authorships", [])
            if author.get("author")
        ]

        primary_location = item.get("primary_location") or {}
        source = primary_location.get("source") or {}

        url = (
            primary_location.get("landing_page_url")
            or item.get("doi")
            or item.get("id")
        )

        papers.append(
            {
                "title": item.get("title") or "Untitled",
                "authors": [author for author in authors if author][:8],
                "year": item.get("publication_year") or 0,
                "description": (
                    source.get("display_name")
                    or "Academic publication"
                ),
                "url": url,
            }
        )

    return papers

def literature_agent(state: ResearchState) -> dict:

    search_query = " ".join(
        [
            state.get("domain", ""),
            *state.get("subtopics", []),
        ]
    ).strip()

    if not search_query:
        search_query = state["question"]

    papers = search_openalex(
        search_query,
        per_page=10,
    )

    papers = [
        paper
        for paper in papers
        if paper["year"] > 0
    ]

    papers.sort(
        key=lambda paper: paper["year"],
        reverse=True,
    )

    recent_papers = papers[:5]

    foundational_papers = [
        paper
        for paper in papers
        if 0 < paper["year"] < 2022
    ][:5]

    return {
        "foundational_papers": foundational_papers,
        "recent_papers": recent_papers,
    }