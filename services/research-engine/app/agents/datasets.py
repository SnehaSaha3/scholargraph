import re
from typing import Any

import httpx

from app.graph.state import ResearchState


HF_DATASETS_URL = "https://huggingface.co/api/datasets"
USER_AGENT = "ScholarGraph/0.1 (research discovery application)"


STOPWORDS = {
    "about",
    "after",
    "against",
    "also",
    "because",
    "between",
    "could",
    "does",
    "from",
    "have",
    "into",
    "more",
    "over",
    "should",
    "that",
    "their",
    "these",
    "this",
    "through",
    "using",
    "what",
    "when",
    "where",
    "which",
    "with",
}


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


GENERIC_DATASET_TERMS = {
    "computer",
    "vision",
    "image",
    "images",
    "dataset",
    "datasets",
    "data",
    "machine",
    "learning",
    "deep",
    "neural",
    "model",
    "models",
}


def meaningful_words(value: str) -> list[str]:
    return [
        word
        for word in normalize_text(value).split()
        if (
            len(word) >= 4
            and word not in STOPWORDS
            and word not in GENERIC_DATASET_TERMS
        )
    ]


def build_search_queries(query: str) -> list[str]:
    """
    Build a small number of meaningful Hugging Face queries.

    We deliberately avoid searching every individual word because that
    produces extremely noisy registry results.
    """
    words = meaningful_words(query)

    if not words:
        return []

    queries: list[str] = []

    # Full query first.
    queries.append(" ".join(words))

    # A shorter query helps when the full phrase is too restrictive.
    if len(words) > 4:
        queries.append(" ".join(words[:4]))

    # Add the strongest pairs.
    for index in range(min(len(words) - 1, 3)):
        pair = f"{words[index]} {words[index + 1]}"
        if pair not in queries:
            queries.append(pair)

    return queries[:5]


def score_dataset(
    dataset: dict[str, Any],
    query_words: set[str],
) -> int:
    """
    Score a dataset using only metadata returned by Hugging Face.

    This is intentionally deterministic and costs zero LLM tokens.
    """
    dataset_id = str(dataset.get("id") or "")
    tags = dataset.get("tags") or []

    if not isinstance(tags, list):
        tags = []

    searchable = normalize_text(
        " ".join(
            [
                dataset_id,
                " ".join(str(tag) for tag in tags),
            ]
        )
    )

    searchable_words = set(searchable.split())

    if not query_words:
        return 0

    exact_matches = query_words & searchable_words

    score = len(exact_matches) * 10

    # Reward matches inside the dataset identifier.
    normalized_id = normalize_text(dataset_id)

    for word in query_words:
        if word in normalized_id.split():
            score += 5

    # Strong signal when several query terms are represented.
    coverage = len(exact_matches) / len(query_words)

    if coverage >= 0.75:
        score += 20
    elif coverage >= 0.5:
        score += 10

    return score


def search_huggingface_datasets(
    query: str,
    limit: int = 8,
) -> list[dict]:
    queries = build_search_queries(query)

    if not queries:
        return []

    datasets_by_id: dict[str, dict] = {}

    for search_query in queries:
        try:
            response = httpx.get(
                HF_DATASETS_URL,
                params={
                    "search": search_query,
                    "limit": 20,
                },
                timeout=20,
                headers={
                    "User-Agent": USER_AGENT,
                },
            )

            response.raise_for_status()

            results = response.json()

            if not isinstance(results, list):
                continue

            print(
                f"[datasets] '{search_query}' -> "
                f"{len(results)} results"
            )

            for item in results:
                if not isinstance(item, dict):
                    continue

                dataset_id = item.get("id")

                if not dataset_id:
                    continue

                score = score_dataset(
                    item,
                    set(meaningful_words(query)),
                )

                # Do not keep completely unrelated registry results.
                if score < 20:
                    continue

                existing = datasets_by_id.get(dataset_id)

                if existing and existing["relevance_score"] >= score:
                    continue

                tags = item.get("tags") or []

                if not isinstance(tags, list):
                    tags = []

                datasets_by_id[dataset_id] = {
                    "title": dataset_id,
                    "resource_type": "Hugging Face Dataset",
                    "description": (
                        "Dataset discovered through the "
                        "Hugging Face dataset registry."
                    ),
                    "url": (
                        "https://huggingface.co/datasets/"
                        f"{dataset_id}"
                    ),
                    "subjects": tags[:10],
                    "source": "Hugging Face",
                    "relevance_score": score,
                }

        except httpx.HTTPError as error:
            print(
                f"[datasets] Failed searching "
                f"'{search_query}': {error}"
            )

    datasets = list(datasets_by_id.values())

    datasets.sort(
        key=lambda item: item.get("relevance_score", 0),
        reverse=True,
    )

    return datasets[:limit]


def dataset_agent(state: ResearchState) -> dict:
    query_parts: list[str] = []

    domain = state.get("domain", "").strip()

    if domain:
        query_parts.append(domain)

    subtopics = state.get("subtopics", [])

    for topic in subtopics[:3]:
        topic = topic.strip()

        if topic:
            query_parts.append(topic)

    query = " ".join(query_parts).strip()

    if not query:
        query = state.get("question", "").strip()

    if not query:
        return {
            "datasets": [],
        }

    try:
        datasets = search_huggingface_datasets(
            query,
            limit=8,
        )
    except httpx.HTTPError as error:
        print(
            "[datasets] Hugging Face request failed:",
            error,
        )
        datasets = []

    return {
        "datasets": datasets,
    }