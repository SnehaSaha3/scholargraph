from fastapi import APIRouter, Query

from app.agents.books import search_open_library
from app.agents.datasets import (
    search_huggingface_datasets,
)


router = APIRouter()


@router.get("/books")
def books(
    query: str = Query(min_length=2),
    limit: int = 12,
):

    return {
        "results": search_open_library(
            query,
            min(limit, 20),
        )
    }


@router.get("/datasets")
def datasets(
    query: str = Query(min_length=2),
    limit: int = 12,
):

    return {
        "results": (
            search_huggingface_datasets(
                query,
                min(limit, 20),
            )
        )
    }