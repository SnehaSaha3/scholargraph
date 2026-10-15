from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.agents.github_review import (
    build_review_evidence,
    inspect_repository,
)
from app.agents.research_implementation import (
    analyze_research_implementation,
)


router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
)


class RepositoryInspectRequest(BaseModel):
    github_url: HttpUrl


class ImplementationAdvisorRequest(BaseModel):
    github_url: HttpUrl
    question: str


@router.post("/repository")
def inspect_project_repository(
    request: RepositoryInspectRequest,
):
    try:
        return inspect_repository(
            str(request.github_url)
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "[projects] GitHub inspection failed:",
            error,
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to inspect GitHub repository.",
        ) from error


@router.post("/implementation")
def analyze_project_implementation(
    request: ImplementationAdvisorRequest,
):
    try:
        evidence = build_review_evidence(
            str(request.github_url),
            request.question,
        )

        return analyze_research_implementation(
            evidence
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "[projects] Implementation advisor failed:",
            error,
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to generate implementation guidance.",
        ) from error