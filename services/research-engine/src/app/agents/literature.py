import os
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import httpx

from app.graph.state import ResearchState


OPENALEX_URL = "https://api.openalex.org/works"
USER_AGENT = "ScholarGraph/0.1 (research discovery application)"

SELECT_FIELDS = ",".join(
    [
        "id",
        "doi",
        "title",
        "publication_year",
        "authorships",
        "primary_location",
        "abstract_inverted_index",
        "cited_by_count",
    ]
)

WORK_TYPES = "article|preprint|review"
MAX_QUERIES = 4
RECENT_TARGET = 5
FOUNDATIONAL_TARGET = 5


def normalize_title(title: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()


def rebuild_abstract(index) -> str:
    if not isinstance(index, dict) or not index:
        return ""

    positions: list[tuple[int, str]] = []

    for word, locations in index.items():
        if not isinstance(locations, list):
            continue

        for location in locations:
            if isinstance(location, int):
                positions.append((location, word))

    positions.sort()

    return " ".join(word for _, word in positions)


def shorten(text: str, limit: int = 280) -> str:
    text = text.strip()

    if len(text) <= limit:
        return text

    cut = text[:limit]
    sentence_end = max(
        cut.rfind(". "),
        cut.rfind("? "),
        cut.rfind("! "),
    )

    if sentence_end >= limit // 2:
        return cut[: sentence_end + 1]

    return cut.rsplit(" ", 1)[0].rstrip(",;:") + "…"


def parse_work(item: dict) -> dict | None:
    title = (item.get("title") or "").strip()
    year = item.get("publication_year") or 0

    if not title or year <= 0:
        return None

    authors = [
        (authorship.get("author") or {}).get("display_name")
        for authorship in item.get("authorships") or []
    ]

    primary_location = item.get("primary_location") or {}
    source = primary_location.get("source") or {}

    url = (
        primary_location.get("landing_page_url")
        or item.get("doi")
        or item.get("id")
    )

    abstract = shorten(
        rebuild_abstract(item.get("abstract_inverted_index"))
    )

    return {
        "title": title,
        "authors": [author for author in authors if author][:8],
        "year": year,
        "description": abstract or source.get("display_name") or "",
        "url": url,
    }


def fetch_works(
    search: str,
    filters: list[str],
    per_page: int,
    by_citations: bool = False,
) -> list[dict]:
    params = {
        "search": search,
        "filter": ",".join(filters),
        "per-page": per_page,
        "select": SELECT_FIELDS,
    }

    mailto = os.getenv("OPENALEX_MAILTO")

    if mailto:
        params["mailto"] = mailto

    try:
        response = httpx.get(
            OPENALEX_URL,
            params=params,
            timeout=20,
            headers={"User-Agent": USER_AGENT},
        )

        response.raise_for_status()

        results = response.json().get("results") or []

    except (httpx.HTTPError, ValueError) as error:
        print(
            f"[literature] OpenAlex request failed for '{search}': {error}"
        )
        return []

    if by_citations:
        results.sort(
            key=lambda item: item.get("cited_by_count") or 0,
            reverse=True,
        )

    works = []

    for item in results:
        work = parse_work(item)

        if work:
            works.append(work)

    return works


def interleave(groups: list[list[dict]], limit: int) -> list[dict]:
    merged: list[dict] = []
    seen: set[str] = set()

    depth = max((len(group) for group in groups), default=0)

    for position in range(depth):
        for group in groups:
            if position >= len(group):
                continue

            work = group[position]
            key = normalize_title(work["title"])

            if key in seen:
                continue

            seen.add(key)
            merged.append(work)

            if len(merged) >= limit:
                return merged

    return merged


def build_queries(state: ResearchState) -> list[str]:
    domain = state.get("domain", "").strip()

    subtopics = [
        topic.strip()
        for topic in state.get("subtopics", [])
        if topic and topic.strip()
    ]

    queries = subtopics[:MAX_QUERIES]

    if len(queries) < 2 and domain:
        queries.append(domain)

    if not queries:
        queries = [state["question"].strip()]

    return queries


def literature_agent(state: ResearchState) -> dict:
    queries = build_queries(state)

    recent_from = date.today().year - 3

    base_filters = [
        "has_abstract:true",
        f"type:{WORK_TYPES}",
    ]

    recent_filters = base_filters + [
        f"from_publication_date:{recent_from}-01-01",
    ]

    foundational_filters = base_filters + [
        f"to_publication_date:{recent_from - 1}-12-31",
        "cited_by_count:>50",
    ]

    with ThreadPoolExecutor(
        max_workers=min(8, len(queries) * 2)
    ) as pool:
        recent_jobs = [
            pool.submit(fetch_works, query, recent_filters, 5)
            for query in queries
        ]

        foundational_jobs = [
            pool.submit(
                fetch_works,
                query,
                foundational_filters,
                5,
                True,
            )
            for query in queries
        ]

        recent_groups = [job.result() for job in recent_jobs]
        foundational_groups = [job.result() for job in foundational_jobs]

    return {
        "foundational_papers": interleave(
            foundational_groups,
            FOUNDATIONAL_TARGET,
        ),
        "recent_papers": interleave(
            recent_groups,
            RECENT_TARGET,
        ),
    }


def search_openalex(query: str, limit: int = 12) -> list[dict]:
    """Search OpenAlex for papers matching a resource-search query."""
    filters = [
        "has_abstract:true",
        f"type:{WORK_TYPES}",
    ]

    return fetch_works(
        search=query.strip(),
        filters=filters,
        per_page=max(1, min(limit, 20)),
    )
