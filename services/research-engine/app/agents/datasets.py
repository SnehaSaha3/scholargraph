
import re
from typing import Any

import httpx

from app.graph.state import ResearchState


HF_DATASETS_URL = "https://huggingface.co/api/datasets"
USER_AGENT = "ScholarGraph/0.1 (research discovery application)"
DEFAULT_LIMIT = 8
REQUEST_TIMEOUT = 20.0


STOPWORDS = {
    "about", "after", "against", "also", "because", "between",
    "could", "does", "from", "have", "into", "more", "over",
    "should", "that", "their", "these", "this", "through",
    "using", "what", "when", "where", "which", "with", "were",
    "will", "would", "your", "they", "them", "than", "then",
    "there", "here", "work", "works",
}

GENERIC_DATASET_TERMS = {
    "computer", "vision", "image", "images", "dataset",
    "datasets", "data", "machine", "learning", "deep",
    "neural", "model", "models", "research", "technology",
    "technologies", "tech", "emerging",
}


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def meaningful_words(value: str) -> list[str]:
    """Extract informative terms while preserving their original order."""
    return [
        word
        for word in normalize_text(value).split()
        if len(word) >= 3 and word not in STOPWORDS
    ]


def build_search_queries(query: str) -> list[str]:
    """
    Build broad-to-specific search queries for Hugging Face.

    Keep the original query as a fallback when it contains mostly
    generic research terminology.
    """
    original = normalize_text(query)
    words = meaningful_words(query)

    queries: list[str] = []

    def add(value: str) -> None:
        value = value.strip()
        if value and value not in queries:
            queries.append(value)

    # Try the complete natural-language query first.
    add(original)

    # Prefer terms that are likely to identify a specific topic.
    specific_words = [
        word for word in words
        if word not in GENERIC_DATASET_TERMS
    ]

    if specific_words:
        add(" ".join(specific_words))

        if len(specific_words) > 4:
            add(" ".join(specific_words[:4]))

        # Search a few pairs without querying every individual word.
        for index in range(min(len(specific_words) - 1, 3)):
            add(
                f"{specific_words[index]} "
                f"{specific_words[index + 1]}"
            )

    # Some queries consist almost entirely of generic terms.
    # Keep a useful fallback instead of returning no queries.
    if len(queries) == 1 and words:
        add(" ".join(words[:4]))

    return queries[:5]


def get_dataset_metadata(dataset: dict[str, Any]) -> str:
    """Build searchable text from available registry metadata."""
    tags = dataset.get("tags") or []
    if not isinstance(tags, list):
        tags = []

    card_data = dataset.get("cardData") or {}
    if not isinstance(card_data, dict):
        card_data = {}

    searchable_parts = [
        str(dataset.get("id") or ""),
        str(dataset.get("description") or ""),
        " ".join(str(tag) for tag in tags),
        str(card_data.get("description") or ""),
        str(card_data.get("task_categories") or ""),
        str(card_data.get("task_ids") or ""),
        str(card_data.get("language") or ""),
        str(card_data.get("pretty_name") or ""),
        str(card_data.get("license") or ""),
    ]

    return normalize_text(" ".join(searchable_parts))


def score_dataset(
    dataset: dict[str, Any],
    query_words: set[str],
) -> int:
    """
    Score datasets using IDs, descriptions, tags and card metadata.
    """
    if not query_words:
        return 0

    searchable = get_dataset_metadata(dataset)
    searchable_words = set(searchable.split())

    matches = query_words & searchable_words
    score = len(matches) * 10

    # Dataset IDs are a useful relevance signal.
    dataset_id = normalize_text(str(dataset.get("id") or ""))
    id_words = set(dataset_id.split())
    score += len(query_words & id_words) * 5

    coverage = len(matches) / len(query_words)

    if coverage >= 0.75:
        score += 20
    elif coverage >= 0.5:
        score += 10

    # Reward a query phrase appearing in the metadata.
    normalized_query = " ".join(sorted(query_words))
    if normalized_query and normalized_query in searchable:
        score += 10

    return score


def format_dataset(
    item: dict[str, Any],
    score: int = 0,
) -> dict[str, Any] | None:
    """Convert a Hugging Face API record to ScholarGraph's result schema."""
    dataset_id = item.get("id")

    if not isinstance(dataset_id, str) or not dataset_id.strip():
        return None

    tags = item.get("tags") or []
    if not isinstance(tags, list):
        tags = []

    card_data = item.get("cardData") or {}
    if not isinstance(card_data, dict):
        card_data = {}

    description = (
        item.get("description")
        or card_data.get("description")
        or "Dataset discovered through the Hugging Face dataset registry."
    )

    return {
        "title": card_data.get("pretty_name") or dataset_id,
        "resource_type": "Hugging Face Dataset",
        "description": str(description),
        "url": f"https://huggingface.co/datasets/{dataset_id}",
        "subjects": [str(tag) for tag in tags[:10]],
        "source": "Hugging Face",
        "relevance_score": score,
    }


def search_huggingface_datasets(
    query: str,
    limit: int = DEFAULT_LIMIT,
) -> list[dict[str, Any]]:
    """
    Search Hugging Face datasets.

    Results are deduplicated and ranked by metadata relevance.
    If the relevance filter finds no matches, return the registry's
    own ranked results rather than incorrectly showing an empty list.
    """
    queries = build_search_queries(query)

    if not queries:
        print("[datasets] No usable search query; using original query.")
        queries = [query.strip()] if query.strip() else []

    if not queries:
        return []

    query_words = set(meaningful_words(query))
    datasets_by_id: dict[str, dict[str, Any]] = {}
    registry_fallback: dict[str, dict[str, Any]] = {}

    headers = {"User-Agent": USER_AGENT}

    try:
        with httpx.Client(
            timeout=REQUEST_TIMEOUT,
            headers=headers,
            follow_redirects=True,
        ) as client:
            for search_query in queries:
                try:
                    response = client.get(
                        HF_DATASETS_URL,
                        params={
                            "search": search_query,
                            "limit": 20,
                        },
                    )
                    response.raise_for_status()

                    results = response.json()

                    if not isinstance(results, list):
                        print(
                            f"[datasets] Unexpected response type for "
                            f"'{search_query}': {type(results).__name__}"
                        )
                        continue

                    print(
                        f"[datasets] '{search_query}' -> "
                        f"{len(results)} registry results"
                    )

                    for item in results:
                        if not isinstance(item, dict):
                            continue

                        dataset_id = item.get("id")
                        if not isinstance(dataset_id, str) or not dataset_id:
                            continue

                        score = score_dataset(item, query_words)
                        formatted = format_dataset(item, score)

                        if formatted is None:
                            continue

                        # Preserve the registry-ranked results as a fallback.
                        if dataset_id not in registry_fallback:
                            registry_fallback[dataset_id] = formatted

                        existing = datasets_by_id.get(dataset_id)

                        if (
                            existing is None
                            or score > existing["relevance_score"]
                        ):
                            datasets_by_id[dataset_id] = formatted

                except httpx.HTTPError as error:
                    print(
                        f"[datasets] Request failed for "
                        f"'{search_query}': {error}"
                    )
                except ValueError as error:
                    print(
                        f"[datasets] Invalid JSON for "
                        f"'{search_query}': {error}"
                    )

    except httpx.HTTPError as error:
        print(f"[datasets] Hugging Face connection failed: {error}")
        return []

    ranked = sorted(
        datasets_by_id.values(),
        key=lambda item: item["relevance_score"],
        reverse=True,
    )

    # Use a softer threshold instead of discarding all weak matches.
    relevant = [
        item for item in ranked
        if item["relevance_score"] >= 10
    ]

    if relevant:
        print(f"[datasets] Returning {min(len(relevant), limit)} relevant results")
        return relevant[:limit]

    # Critical fallback: do not return [] just because our scoring
    # rules failed to recognize the registry's search results.
    fallback = list(registry_fallback.values())

    print(
        f"[datasets] No results passed relevance threshold. "
        f"Using {len(fallback)} registry-ranked fallback results."
    )

    return fallback[:limit]


def dataset_agent(state: ResearchState) -> dict:
    """LangGraph node that discovers datasets for a research query."""
    query_parts: list[str] = []

    domain = state.get("domain") or ""
    if isinstance(domain, str) and domain.strip():
        query_parts.append(domain.strip())

    subtopics = state.get("subtopics") or []

    if isinstance(subtopics, list):
        for topic in subtopics[:3]:
            if isinstance(topic, str) and topic.strip():
                query_parts.append(topic.strip())

    query = " ".join(query_parts).strip()

    if not query:
        question = state.get("question") or ""
        query = question.strip() if isinstance(question, str) else ""

    if not query:
        print("[datasets] No domain, subtopics or question in state.")
        return {"datasets": []}

    print(f"[datasets] Searching for: {query!r}")

    try:
        datasets = search_huggingface_datasets(
            query,
            limit=DEFAULT_LIMIT,
        )
    except Exception as error:
        # Keep the graph running, but log unexpected bugs for diagnosis.
        print(
            f"[datasets] Unexpected dataset-agent error: "
            f"{type(error).__name__}: {error}"
        )
        datasets = []

    print(f"[datasets] Final dataset count: {len(datasets)}")

    return {"datasets": datasets}
