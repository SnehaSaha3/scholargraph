import httpx

from app.graph.state import ResearchState


HF_DATASETS_URL = "https://huggingface.co/api/datasets"


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
                "resource_type": "Hugging Face Dataset",
                "description": (
                    "Dataset discovered through the "
                    "Hugging Face dataset registry."
                ),
                "url": (
                    f"https://huggingface.co/datasets/"
                    f"{dataset_id}"
                ),
            }
        )

    return datasets


def dataset_agent(state: ResearchState) -> dict:

    datasets = search_huggingface_datasets(
        state["question"],
        limit=8,
    )

    return {
        "datasets": datasets,
    }