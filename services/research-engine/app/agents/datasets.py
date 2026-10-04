import re

import httpx

from app.graph.state import ResearchState


HF_DATASETS_URL = "https://huggingface.co/api/datasets"
USER_AGENT = "ScholarGraph/0.1 (research discovery application)"


def normalize_text(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def search_huggingface_datasets(
    query: str,
    limit: int = 8,
) -> list[dict]:
    words = [
        word
        for word in normalize_text(query).split()
        if len(word) >= 4
    ]

    if not words:
        return []

    datasets_by_id: dict[str, dict] = {}

    for search_query in words:
        try:
            response = httpx.get(
                HF_DATASETS_URL,
                params={
                    "search": search_query,
                    "limit": 12,
                },
                timeout=20,
                headers={
                    "User-Agent": USER_AGENT,
                },
            )

            response.raise_for_status()

            results = response.json()

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

                if dataset_id in datasets_by_id:
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
                    "relevance_score": 0,
                }

        except httpx.HTTPError as error:
            print(
                f"[datasets] Failed searching "
                f"'{search_query}': {error}"
            )

    datasets = list(datasets_by_id.values())

    return datasets[:limit]

def dataset_agent(state: ResearchState) -> dict:
    query_parts = []

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
        return {"datasets": []}

    try:
        datasets = search_huggingface_datasets(
            query,
            limit=8,
        )
    except httpx.HTTPError as error:
        print("[datasets] Hugging Face request failed:", error)
        datasets = []

    return {
        "datasets": datasets,
    }