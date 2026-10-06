from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from app.agents.github_review import inspect_repository


router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
)


class RepositoryInspectRequest(BaseModel):
    github_url: HttpUrl


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