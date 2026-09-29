import re

import httpx

from app.graph.state import ResearchState


OPEN_LIBRARY_URL = "https://openlibrary.org/search.json"

USER_AGENT = (
    "ScholarGraph/0.1 "
    "(research discovery application)"
)


def normalize_text(value: str) -> str:
    """Normalize text for relevance matching."""

    value = value.lower()

    value = re.sub(
        r"[^a-z0-9\s]",
        " ",
        value,
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value.strip()


def build_book_query(
    state: ResearchState,
) -> str:

    domain = state.get(
        "domain",
        "",
    ).strip()

    subtopics = [
        topic.strip()
        for topic in state.get(
            "subtopics",
            [],
        )
        if topic.strip()
    ]

    parts = []

    if domain:
        parts.append(domain)

    parts.extend(
        subtopics[:3]
    )

    return " ".join(parts)


def calculate_relevance(
    title: str,
    subjects: list[str],
    query_terms: list[str],
) -> int:

    text = normalize_text(
        " ".join(
            [
                title,
                *subjects,
            ]
        )
    )

    score = 0

    for term in query_terms:

        normalized_term = normalize_text(
            term
        )

        if not normalized_term:
            continue

        words = normalized_term.split()

        if normalized_term in text:
            score += 5

        for word in words:

            if len(word) < 4:
                continue

            if word in text:
                score += 1

    return score


def extract_access(
    item: dict,
) -> dict:

    ebook_access = (
        item.get("ebook_access")
        or "no_ebook"
    )

    ia_identifiers = item.get(
        "ia",
        [],
    )

    ia_id = (
        ia_identifiers[0]
        if ia_identifiers
        else None
    )

    open_library_url = (
        f"https://openlibrary.org"
        f"{item['key']}"
        if item.get("key")
        else None
    )

    read_url = None
    borrow_url = None

    if ia_id:
        read_url = (
            "https://archive.org/details/"
            f"{ia_id}"
        )

    if ebook_access == "public":
        access_type = "public"
        action_label = "Read online"

    elif ebook_access == "borrowable":
        access_type = "borrowable"
        action_label = "Borrow"

        if open_library_url:
            borrow_url = open_library_url

    elif ebook_access == "printdisabled":
        access_type = "printdisabled"
        action_label = "Accessible reading"

    else:
        access_type = "catalog"
        action_label = "View source"

    return {
        "access_type": access_type,
        "action_label": action_label,
        "read_url": read_url,
        "borrow_url": borrow_url,
        "source_url": open_library_url,
    }


def search_open_library(
    query: str,
    limit: int = 8,
) -> list[dict]:

    response = httpx.get(
        OPEN_LIBRARY_URL,
        params={
            "q": query,
            "limit": min(limit, 20),
            "fields": (
                "key,"
                "title,"
                "author_name,"
                "first_publish_year,"
                "cover_i,"
                "subject,"
                "ebook_access,"
                "ia"
            ),
        },
        timeout=20,
        headers={
            "User-Agent": USER_AGENT,
        },
    )

    response.raise_for_status()

    data = response.json()

    query_terms = [
        term
        for term in normalize_text(
            query
        ).split()
        if len(term) >= 4
    ]

    books = []

    seen_titles = set()

    for item in data.get(
        "docs",
        [],
    ):

        title = (
            item.get("title")
            or ""
        ).strip()

        if not title:
            continue

        normalized_title = normalize_text(
            title
        )

        if normalized_title in seen_titles:
            continue

        subjects = item.get(
            "subject",
            [],
        )

        if not isinstance(
            subjects,
            list,
        ):
            subjects = []

        subjects = [
            subject
            for subject in subjects
            if isinstance(
                subject,
                str,
            )
        ][:20]

        relevance = calculate_relevance(
            title,
            subjects,
            query_terms,
        )

        # Reject extremely weak matches.
        if relevance < 2:
            continue

        seen_titles.add(
            normalized_title
        )

        access = extract_access(
            item
        )

        cover_id = item.get(
            "cover_i"
        )

        books.append(
            {
                "title": title,

                "authors": item.get(
                    "author_name",
                    [],
                )[:5],

                "year": (
                    item.get(
                        "first_publish_year"
                    )
                    or 0
                ),

                "resource_type": "Book",

                "description": (
                    "Book discovered through "
                    "Open Library."
                ),

                "url": access[
                    "source_url"
                ],

                "cover_url": (
                    "https://covers.openlibrary.org/"
                    f"b/id/{cover_id}-M.jpg"
                    if cover_id
                    else None
                ),

                "subjects": subjects[:10],

                "access_type": access[
                    "access_type"
                ],

                "action_label": access[
                    "action_label"
                ],

                "read_url": access[
                    "read_url"
                ],

                "borrow_url": access[
                    "borrow_url"
                ],

                "source": "Open Library",

                "relevance_score": relevance,
            }
        )

    books.sort(
        key=lambda book: (
            book["relevance_score"],
            book["year"],
        ),
        reverse=True,
    )

    return books[:limit]


def book_agent(
    state: ResearchState,
) -> dict:

    query = build_book_query(
        state
    )

    if not query:
        query = state["question"]

    try:

        books = search_open_library(
            query,
            limit=8,
        )

    except httpx.HTTPError as error:

        print(
            "[books] Open Library request failed:",
            error,
        )

        books = []

    return {
        "books": books,
    }