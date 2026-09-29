import httpx

from app.graph.state import ResearchState


HF_DATASETS_URL = (
    "https://huggingface.co/api/datasets"
)


def search_huggingface_datasets(
    query: str,
    limit: int = 8,
) -> list[dict]:

    response = httpx.get(
        HF_DATASETS_URL,
        params={
            "search": query,
            "limit": limit,
        },
        timeout=20,
        headers={
            "User-Agent": "ScholarGraph/0.1"
        },
    )

    response.raise_for_status()

    results = response.json()

    datasets = []

    for item in results:

        dataset_id = item.get("id")

        if not dataset_id:
            continue

        datasets.append(
            {
                "title": dataset_id,
                "resource_type": (
                    "Hugging Face Dataset"
                ),
                "description": (
                    "Dataset discovered through "
                    "the Hugging Face Hub."
                ),
                "url": (
                    "https://huggingface.co/datasets/"
                    f"{dataset_id}"
                ),
            }
        )

    return datasets


def dataset_agent(
    state: ResearchState,
) -> dict:

    query = " ".join(
        [
            state.get("domain", ""),
            *state.get("subtopics", [])[:3],
        ]
    ).strip()

    if not query:
        query = state["question"]

    try:

        datasets = (
            search_huggingface_datasets(
                query,
                limit=8,
            )
        )

    except httpx.HTTPError:

        datasets = []

    return {
        "datasets": datasets,
    }